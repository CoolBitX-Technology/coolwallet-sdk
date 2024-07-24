import * as bip39 from 'bip39';
import pbkdf2 from 'pbkdf2';
import isEmpty from 'lodash/isEmpty';
import Transport from '../transport';
import { MSG } from '../config/status/msg';
import { CODE } from '../config/status/code';
import { PathType } from '../config/param';
import { SDKError } from '../error/errorHandle';
import { info, tx, wallet } from '..';

function hardenPath(index: number) {
  return (Math.floor(index) + 0x80000000).toString(16);
}

// input :
//    pathType : BIP32 = '32', SLIP0010 = '10', BIP32EDDSA = '42', BIP32ED25519 = '17'
//    pathString : 44'/0'/0'/0/0
//
// output : [path_type(1B)] [index(4B)] x 5
//    32 8000002C 80000000 80000000 00000000 00000000
export const getFullPath = ({
  pathType = PathType.BIP32,
  pathString,
}: {
  pathType: PathType;
  pathString: string;
}): string => {
  const paths = pathString.split('/').map((index) => {
    if (!index.match(/^\d+(|')$/)) {
      throw new SDKError('getFullPath', `invalid pathString : ${pathString}`);
    }
    if (index.endsWith("'")) {
      return hardenPath(parseInt(index.slice(0, -1), 10));
    }
    return parseInt(index, 10).toString(16).padStart(8, '0');
  });
  return pathType.toString().concat(...paths);
};

export const getPath = async (
  coinType: string,
  keyIndex: number,
  depth = 5,
  pathType = PathType.BIP32,
  purpose?: number
): Promise<string> => {
  let fullPath = pathType.toString();
  if (depth >= 1) {
    if (purpose) {
      fullPath += (purpose + 0x80000000).toString(16);
    } else {
      fullPath += '8000002C';
    }
  }
  if (depth >= 2) {
    fullPath += coinType;
  }
  if (depth >= 3) {
    fullPath += '80000000';
  }
  if (pathType === PathType.SLIP0010 || pathType === PathType.BIP32ED25519) {
    return fullPath;
  }
  if (depth >= 4) {
    fullPath += '00000000';
  }
  if (depth >= 5) {
    fullPath += keyIndex.toString(16).padStart(8, '0');
  }
  return fullPath;
};

export const getReturnMsg = (code: string): string => {
  const message = MSG[`_${code}`] ? MSG[`_${code}`] : 'unknown command error';
  return message;
};

const getCheckSum = (data: any) => {
  let XORTemp = 0;
  for (let i = 0; i < data.length; i++) {
    // eslint-disable-next-line no-bitwise
    XORTemp ^= parseInt(data[i], 16);
  }
  let temp = XORTemp.toString(16);
  if (temp.length % 2 !== 0) {
    temp = `0${temp}`;
  }

  return temp;
};

export const assemblyCommandAndData = (
  cla: string,
  ins: string,
  p1: string | undefined,
  p2: string | undefined,
  oriData: string
) => {
  const pid = '00';
  const cmdLen = '09';

  const packetLength = 18;
  let dataLength = 0;

  let packets = oriData ?? '';

  let dataBuf = Buffer.from(packets, 'hex');
  // Origin data length
  const oriDataLength = dataBuf.length;

  if (!isEmpty(dataBuf)) {
    const data = packets.match(/.{2}/g);
    const checksum = getCheckSum(data);
    packets += checksum;
    dataBuf = Buffer.concat([dataBuf, Buffer.from(checksum, 'hex')]);
  }

  // Data with checksum length
  const XORLength = dataBuf.length;

  if (dataBuf.length > 0) {
    const length = dataBuf.length / packetLength;
    const remains = dataBuf.length % packetLength;
    dataLength += length;
    if (remains !== 0) {
      dataLength += 1;
    }
  }

  const oriDataBuf = Buffer.allocUnsafe(4);
  oriDataBuf.fill(0);
  oriDataBuf.writeInt16BE(oriDataLength, 0);
  const hexOriDataLength = oriDataBuf.slice(0, 2).toString('hex').padStart(4, '0');

  const XORData = Buffer.allocUnsafe(4);
  XORData.fill(0);
  XORData.writeInt16BE(XORLength, 0);
  const hexXORLength = XORData.slice(0, 2).toString('hex').padStart(4, '0');
  const hexDataLength = Buffer.from([dataLength]).toString('hex');

  // 00 09 80 54 00 00 0000 0000 00
  const command = pid + cmdLen + cla + ins + p1 + p2 + hexOriDataLength + hexXORLength + hexDataLength;
  return { command, data: packets };
};

export const checkSupportScripts = async (transport: Transport) => {
  const { statusCode } = await tx.command.getSignedHex(transport);
  if (statusCode === CODE._9000) {
    return true;
  } else if (statusCode === CODE._6D00) {
    return false;
  } else {
    throw new SDKError(checkSupportScripts.name, 'checkSupportScripts error');
  }
};

export const createSeedByApp = async (wordNumber: number, randomBytes: (size: number) => Buffer): Promise<string> => {
  const strength = wordNumber * 11 - wordNumber / 3;
  return bip39.generateMnemonic(strength, randomBytes);
};

const createAdaMasterKeyByMnemonic = (mnemonic: string): Buffer => {
  const entropy = bip39.mnemonicToEntropy(mnemonic);
  const key = pbkdf2.pbkdf2Sync('', Buffer.from(entropy, 'hex'), 4096, 96, 'sha512');
  key[0] &= 0b11111000;
  key[31] &= 0b00011111;
  key[31] |= 0b01000000;
  return key;
};

const createBip39SeedByMnemonic = async (mnemonic: string): Promise<Buffer> => {
  return bip39.mnemonicToSeed(mnemonic);
};

export const createSeedsHexByMnemonic = async (mnemonic: string): Promise<string> => {
  const seeds: Array<Buffer> = [];

  // mnemonic to seed
  seeds[0] = await createBip39SeedByMnemonic(mnemonic);

  // mnemonic to ADA master key
  seeds[1] = createAdaMasterKeyByMnemonic(mnemonic);

  return Buffer.concat(seeds).toString('hex');
};

export const createWalletByMnemonic = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  mnemonic: string,
  SEPublicKey: string
): Promise<void> => {
  const seeds: Array<Buffer> = [];

  // mnemonic to seed
  seeds[0] = await createBip39SeedByMnemonic(mnemonic);

  // mnemonic to ADA master key
  const version = await info.getSEVersion(transport);
  if (version >= 317) {
    seeds[1] = createAdaMasterKeyByMnemonic(mnemonic);
  }

  const seedHex = Buffer.concat(seeds).toString('hex');
  return wallet.secret.setSeed(transport, appId, appPrivateKey, seedHex, SEPublicKey);
};

/**
 * Delay the promise and then resolve.
 * @param {number} d The duration to delay the promise.
 * @returns {Promise<void>}
 */
export const delay = (d: number): Promise<void> => new Promise((r) => setTimeout(r, d));
