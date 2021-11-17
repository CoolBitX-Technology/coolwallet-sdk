import * as tx from '../apdu/transaction';
import Transport from '../transport';
import { MSG } from '../config/status/msg';
import { CODE } from '../config/status/code';
import { PathType } from '../config/param';
import { SDKError } from '../error/errorHandle';

const bip39 = require('bip39');

// [path_type (1B)][purpose (4B)][coin_type (4B)][account (4B)]
export const getAccountPath = async ({
  pathType = PathType.BIP32,
  purpose = '8000002C',
  coinType = '80000000',
}): Promise<string> => {
  const fullPath = `${pathType.toString()}${purpose}${coinType}80000000`;
  return fullPath;
};

export const getPath = async (
  coinType: string, keyIndex: number, depth = 5, path = PathType.BIP32
): Promise<string> => {
  let fullPath = path.toString();

  if (depth >= 1) {
    fullPath += '8000002C';
  }
  if (depth >= 2) {
    fullPath += coinType;
  }
  if (depth >= 3) {
    fullPath += '80000000';
  }
  if (path === PathType.SLIP0010 || path === PathType.BIP32ED25519) {
    return fullPath;
  }
  if (depth >= 4) {
    fullPath += '00000000';
  }
  if (depth >= 5) {
    fullPath += (keyIndex.toString(16)).padStart(8, '0');
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
  // flag = true;
  let packets = '';

  if (oriData) {
    packets = oriData;
    const data = packets.match(/.{2}/g);
    const checksum = getCheckSum(data);
    packets += checksum;
  }

  const dataBuf = Buffer.from(packets, 'hex');
  let copiedData = dataBuf;
  let XORLength = dataBuf.length;
  let oriDataLength = XORLength;

  if (packets.length > 0) {
    // copiedData = Buffer.from(copiedData, 'hex');
    const length = copiedData.length / packetLength;
    const remains = copiedData.length % packetLength;
    dataLength += length;
    if (remains > 0) {
      dataLength += 1;
    }

    oriDataLength -= 1;
  }

  const oriDataBuf = Buffer.allocUnsafe(4);
  oriDataBuf.fill(0);
  oriDataBuf.writeInt16BE(oriDataLength, 0);
  const hexOriDataLength = oriDataBuf.slice(0, 2).toString('hex').padStart(4, '0');

  const XORData = Buffer.allocUnsafe(4);
  XORData.fill(0);
  XORData.writeInt16BE(XORLength, 0);
  const hexXORLength = XORData.slice(0, 2).toString('hex').padStart(4, '0');
  const hexBataLength = Buffer.from([dataLength]).toString('hex');

  const command = pid + cmdLen + cla + ins + p1 + p2 + hexOriDataLength + hexXORLength + hexBataLength;
  return { command, data: packets };
};


export const checkSupportScripts = async (transport: Transport) => {
  const { statusCode } = await tx.getSignedHex(transport);
  if (statusCode === CODE._9000){
    return true;
  } else if (statusCode === CODE._6D00) {
    return false;
  } else {
    throw new SDKError(checkSupportScripts.name, 'checkSupportScripts error')
  }
};



export const createSeedByApp = async (strength: number, randomBytes: Buffer): Promise<string> => {

  const toBit = strength * 10.7;
  const toFloor = Math.floor(toBit);

  let mnemonic;
  const word = bip39.wordlists.english;
  mnemonic = bip39.generateMnemonic(toFloor, randomBytes, word, false);
  return mnemonic

}
