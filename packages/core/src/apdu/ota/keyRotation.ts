import Transport from '../../transport';
import { executeCommand } from '../execute/execute';
import { securityDomainCommands } from '../execute/command';
import { target } from '../../config/param';
import { CODE } from '../../config/status/code';
import { APDUError, SDKError } from '../../error/errorHandle';
import { CARDMANAGER_AID, SSD_AID, SSD_UNROTATED_KVN, ISD_UNROTATED_KVN } from './constants';
import type { KeyInfo } from './types';

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
