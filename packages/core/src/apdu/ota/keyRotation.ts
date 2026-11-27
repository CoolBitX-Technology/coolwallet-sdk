import Transport, { CardType } from '../../transport';
import { executeAPDU, executeCommand } from '../execute/execute';
import { securityDomainCommands } from '../execute/command';
import { target } from '../../config/param';
import { CODE } from '../../config/status/code';
import { APDUError, SDKError } from '../../error/errorHandle';
import { assemblyCommandAndData, delay } from '../../utils';
import { CARDMANAGER_AID, SSD_AID, SSD_UNROTATED_KVN, ISD_UNROTATED_KVN } from './constants';
import {
  KeyRotationAPIError,
  cancelKeyRotationFlow,
  createKeyRotationFlow,
  startKeyRotationSession,
  submitKeyRotationResponse,
} from './keyRotationApi';
import type { KeyRotationApiParams } from './keyRotationApi';
import type { KeyInfo } from './types';

interface ParsedApdu {
  CLA: string;
  INS: string;
  P1: string;
  P2: string;
  data: string;
}

/**
 * Split a short command APDU (hex) into its header and data. The transport takes the header and
 * the data only and adds the length itself, so Lc and Le are dropped.
 *   case 1: CLA INS P1 P2            case 3: CLA INS P1 P2 Lc data
 *   case 2: CLA INS P1 P2 Le         case 4: CLA INS P1 P2 Lc data Le
 */
export const parseApdu = (apdu: string): ParsedApdu => {
  if (!/^([0-9a-fA-F]{2})+$/.test(apdu)) {
    throw new SDKError(parseApdu.name, `Invalid APDU: ${apdu}`);
  }
  const hex = apdu.toUpperCase();
  const length = hex.length / 2;
  const header = { CLA: hex.slice(0, 2), INS: hex.slice(2, 4), P1: hex.slice(4, 6), P2: hex.slice(6, 8) };
  if (length === 4 || length === 5) return { ...header, data: '' };
  const lc = parseInt(hex.slice(8, 10), 16);
  if (length > 5 && lc > 0 && (length === 5 + lc || length === 6 + lc)) {
    return { ...header, data: hex.slice(10, 10 + lc * 2) };
  }
  throw new SDKError(parseApdu.name, `Invalid APDU length: ${apdu}`);
};

/**
 * Send a command the key rotation API gave to the card as is and return the card's response
 * (data ‖ SW, hex), whatever the SW: the API judges it. The command is sent isolated, because
 * within a session any other command to the card ends the secure channel.
 */
export const transmitApdu = async (transport: Transport, apdu: string): Promise<string> => {
  const { CLA, INS, P1, P2, data } = parseApdu(apdu);
  const { statusCode, outputData } = await executeAPDU(
    transport,
    assemblyCommandAndData(CLA, INS, P1, P2, data),
    target.SE,
    { isolated: true }
  );
  return outputData + statusCode;
};

/**
 * Read the key version numbers from a key information template:
 * E0 L { C0 L keyId KVN keyType keyLength ... }. The KVN is the second byte of each C0 entry,
 * in both the basic and the extended key information format.
 * @param data GET DATA response without the status word, hex
 */
export const parseKeyVersions = (data: string): number[] => {
  const bytes = Buffer.from(data, 'hex');
  const fail = (reason: string) => new SDKError(parseKeyVersions.name, `Invalid key information ${data}: ${reason}`);
  if (bytes.length < 2 || bytes[0] !== 0xe0) throw fail('no E0 template');

  // BER length: one byte, or 0x81 followed by one byte
  let offset = 2;
  let length = bytes[1];
  if (length === 0x81) {
    if (bytes.length < 3) throw fail('truncated length');
    length = bytes[2];
    offset = 3;
  } else if (length > 0x7f) {
    throw fail('unsupported length');
  }
  const end = offset + length;
  if (end !== bytes.length) throw fail('length does not match');

  const versions: number[] = [];
  while (offset < end) {
    if (offset + 2 > end || bytes[offset] !== 0xc0) throw fail(`no C0 entry at byte ${offset}`);
    const entryLength = bytes[offset + 1];
    const entryEnd = offset + 2 + entryLength;
    if (entryLength < 2 || entryEnd > end) throw fail(`bad C0 entry at byte ${offset}`);
    versions.push(bytes[offset + 3]);
    offset = entryEnd;
  }
  if (versions.length === 0) throw fail('no keys');
  return versions;
};

/**
 * Select a security domain and read its key information. No authentication is needed.
 * Returns the whole GET DATA response (data ‖ SW, hex), which the key rotation API takes as is,
 * and the key version numbers in it.
 */
const readDomainKeyInfo = async (
  transport: Transport,
  aid: string
): Promise<{ keyInfo: string; versions: number[] }> => {
  const select = await executeCommand(transport, securityDomainCommands.SELECT_APPLET, target.SE, aid);
  if (select.statusCode !== CODE._9000) {
    throw new APDUError(securityDomainCommands.SELECT_APPLET, select.statusCode, select.msg);
  }
  const { statusCode, outputData, msg } = await executeCommand(
    transport,
    securityDomainCommands.GET_KEY_INFO,
    target.SE
  );
  if (statusCode !== CODE._9000) {
    throw new APDUError(securityDomainCommands.GET_KEY_INFO, statusCode, msg);
  }
  return { keyInfo: outputData + statusCode, versions: parseKeyVersions(outputData) };
};

/**
 * Read the key information of the SSD and the ISD, used to create a key rotation flow, and tell
 * whether each domain still has its original keys.
 * Read it again for every flow, on the same connection as the card id sent with it: the backend
 * does not check that the key information belongs to that card.
 * @param transport
 */
export const getKeyInfo = async (transport: Transport): Promise<KeyInfo> => {
  const ssd = await readDomainKeyInfo(transport, SSD_AID);
  const isd = await readDomainKeyInfo(transport, CARDMANAGER_AID);
  return {
    ssdKeyInfo: ssd.keyInfo,
    isdKeyInfo: isd.keyInfo,
    isNeedRotateSsdKey: ssd.versions.includes(SSD_UNROTATED_KVN),
    isNeedRotateIsdKey: isd.versions.includes(ISD_UNROTATED_KVN),
  };
};

// Resends of one API request: the same request gives the same result (docs section 4)
const API_ATTEMPTS = 3;
const DEFAULT_RETRY_AFTER_SEC = 1;
// A flow has at most four sessions of four commands; this only stops a runaway loop
const MAX_EXCHANGES = 40;

/**
 * Call the key rotation API, resending the same request after a temporary error or a lost response.
 * Never used for the card: a command the card has answered is never sent again.
 */
const callWithResend = async <T>(call: () => Promise<T>): Promise<T> => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await call();
    } catch (e) {
      // An error the API answered on purpose is final; only temporary ones and lost responses are resent
      const final = e instanceof KeyRotationAPIError && !e.isRetryable;
      if (final || attempt >= API_ATTEMPTS) throw e;
      const retryAfter = e instanceof KeyRotationAPIError ? e.retryAfter : undefined;
      await delay((retryAfter ?? DEFAULT_RETRY_AFTER_SEC) * 1000);
    }
  }
};

interface RotateKeyParams extends KeyRotationApiParams {
  transport: Transport;
  // Called after each session of the flow
  progressCallback?: (completedSessions: number, totalSessions: number) => void;
}

/**
 * Rotate the SSD and ISD keys of a CoolWallet Pro through the key rotation API
 * (cp-ota-api-v2 docs/key-rotation-api.md). Firmware signed with the new token key installs only
 * after this, and firmware signed with the old one only before it.
 *
 * Skips the API when neither domain has its issued keys left. Otherwise creates a flow from the key
 * information just read and relays each command between the API and the card until the flow is done.
 * cardId must be the id of the card on this transport.
 *
 * Never restarts on its own: the card locks after too many unfinished authentications, so after an
 * error the flow is cancelled and the error thrown, and starting again is up to the user.
 * A KeyRotationAPIError with code 40916 means the card used up its rotations: contact support.
 * @returns whether a flow ran
 */
export const rotateKey = async ({ transport, progressCallback, ...api }: RotateKeyParams): Promise<boolean> => {
  if (transport.cardType !== CardType.Pro) {
    throw new SDKError(rotateKey.name, `Key rotation is not supported for card type ${transport.cardType}`);
  }

  const keyInfo = await getKeyInfo(transport);
  if (!keyInfo.isNeedRotateSsdKey && !keyInfo.isNeedRotateIsdKey) return false;

  // Nothing has been sent to the card yet, and a new flow for the card replaces the previous one
  const flow = await callWithResend(() => createKeyRotationFlow(api, keyInfo.ssdKeyInfo, keyInfo.isdKeyInfo));
  const totalSessions = flow.sessions.length;
  let completedSessions = 0;
  try {
    let step = await callWithResend(() => startKeyRotationSession(api, flow.flowId));
    for (let exchange = 0; ; exchange += 1) {
      if (exchange >= MAX_EXCHANGES) throw new SDKError(rotateKey.name, 'Key rotation did not finish');

      if (step.status === 'done') {
        completedSessions += 1;
        progressCallback?.(completedSessions, totalSessions);
        if (step.flowState === 'DONE') return true;
        step = await callWithResend(() => startKeyRotationSession(api, flow.flowId));
      } else {
        const { sessionId, select, step: stepNumber, apdu } = step;
        if (stepNumber === undefined || !apdu) {
          throw new SDKError(rotateKey.name, `Key rotation API returned no command: ${JSON.stringify(step)}`);
        }
        if (select) {
          // Its response is not reported, but a failed SELECT would send the session to another applet
          const selected = await transmitApdu(transport, select);
          if (!selected.endsWith(CODE._9000)) {
            throw new SDKError(rotateKey.name, `SELECT of the ${step.domain} failed: ${selected.slice(-4)}`);
          }
        }
        const response = await transmitApdu(transport, apdu);
        step = await callWithResend(() => submitKeyRotationResponse(api, flow.flowId, sessionId, stepNumber, response));
      }
    }
  } catch (e) {
    // The flow cannot go on; a new one needs the key information read again.
    try {
      await cancelKeyRotationFlow(api, flow.flowId);
    } catch (cancelError) {
      console.warn(`cancelKeyRotationFlow failed: ${cancelError}`);
    }
    throw e;
  }
};
