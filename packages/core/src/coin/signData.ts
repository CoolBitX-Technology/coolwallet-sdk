import { commands } from '../apdu/execute/command';
import { executeCommand } from '../apdu/execute/execute';
import { PathType, target } from '../config/param';
import { CODE } from '../config/status/code';
import { convertToDER, getCanonicalSignature, parseDERsignature } from '../crypto/signature';
import { APDUError, SDKError } from '../error/errorHandle';
import { isSigningOnlyFirmware } from '../info';
import { getCommandSignature } from '../setting/auth';
import { removeHex0x } from '../utils';
import { SignCurve, SignDataParams, SignDataResult } from './config/types';

// executeAPDU accepts at most 4096 hex chars of data, including the 1-byte checksum.
const MAX_APDU_DATA_LENGTH = 2047;
// appId (20B) + right-justified command signature (72B)
const COMMAND_SIGNATURE_LENGTH = 92;
// pathType (1B) + up to 5 indices (4B each), same limit as the SE's Bip32 / Bip32Ed25519
const MAX_PATH_LENGTH = 21;
const DIGEST_LENGTH = 32;
const SIGNATURE_LENGTH = 64;

// Same pairing the SE enforces in KeyManager.checkSignParameter (6A86 on mismatch).
const SUPPORTED_PATH_TYPES: Record<SignCurve, string[]> = {
  [SignCurve.SECP256K1]: [PathType.BIP32],
  [SignCurve.SCHNORR]: [PathType.BIP340, PathType.BIP32],
  [SignCurve.ED25519]: [PathType.SLIP0010, PathType.BIP32EDDSA],
  [SignCurve.BIP32ED25519]: [PathType.BIP32ED25519],
};

const isHex = (value: string): boolean => /^([0-9a-fA-F]{2})*$/.test(value);

const checkParameters = (path: string, curve: SignCurve, data: string) => {
  if (!Object.values(SignCurve).includes(curve)) {
    throw new SDKError(signData.name, `unsupported curve: ${curve}`);
  }
  const pathLength = path.length / 2;
  if (!isHex(path) || pathLength < 1 || pathLength > MAX_PATH_LENGTH || (pathLength - 1) % 4 !== 0) {
    throw new SDKError(signData.name, `invalid path: ${path}`);
  }
  const pathType = path.slice(0, 2);
  if (!SUPPORTED_PATH_TYPES[curve].includes(pathType)) {
    throw new SDKError(signData.name, `path type ${pathType} cannot be used with curve ${curve}`);
  }
  if (!isHex(data)) {
    throw new SDKError(signData.name, 'data is not a hex string');
  }
  const dataLength = data.length / 2;
  if (curve === SignCurve.SECP256K1 || curve === SignCurve.SCHNORR) {
    if (dataLength !== DIGEST_LENGTH) {
      throw new SDKError(signData.name, `curve ${curve} signs a ${DIGEST_LENGTH}-byte digest, got ${dataLength} bytes`);
    }
  } else if (dataLength === 0) {
    throw new SDKError(signData.name, 'data is empty');
  }
  const maxDataLength = MAX_APDU_DATA_LENGTH - COMMAND_SIGNATURE_LENGTH - 1 - pathLength;
  if (dataLength > maxDataLength) {
    throw new SDKError(signData.name, `data too long: ${dataLength} bytes, max ${maxDataLength} bytes`);
  }
};

const formatSignature = (curve: SignCurve, signature: string): SignDataResult => {
  if (curve === SignCurve.SECP256K1) {
    const canonicalSignature = getCanonicalSignature(parseDERsignature(signature));
    return {
      curve,
      der: convertToDER(canonicalSignature).toString('hex'),
      r: canonicalSignature.r32,
      s: canonicalSignature.s32,
    };
  }
  if (signature.length !== SIGNATURE_LENGTH * 2) {
    throw new SDKError(signData.name, `unexpected signature length: ${signature.length / 2} bytes`);
  }
  return { curve, signature } as SignDataResult;
};

/**
 * Sign a digest or raw message with SIGN_DATA (INS 0xA0) on CoolWallet Go signing-only firmware.
 * The card has no display: whatever is passed in gets signed.
 */
export async function signData<C extends SignCurve>(params: SignDataParams<C>): Promise<SignDataResult<C>> {
  const { transport, appId, appPrivateKey, curve } = params;
  const path = removeHex0x(params.path);
  const data = removeHex0x(params.data);
  checkParameters(path, curve, data);

  if (!(await isSigningOnlyFirmware(transport))) {
    throw new SDKError(signData.name, 'requires CoolWallet Go signing-only firmware');
  }

  const pathLength = (path.length / 2).toString(16).padStart(2, '0');
  const body = pathLength + path + data;
  const signature = await getCommandSignature(transport, appId, appPrivateKey, commands.SIGN_DATA, body, curve, '00');
  const { statusCode, msg, outputData } = await executeCommand(
    transport,
    commands.SIGN_DATA,
    target.SE,
    body + signature,
    curve,
    '00'
  );
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.SIGN_DATA, statusCode, msg);
  }
  return formatSignature(curve, outputData) as SignDataResult<C>;
}
