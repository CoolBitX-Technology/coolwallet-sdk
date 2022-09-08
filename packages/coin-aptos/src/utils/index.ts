/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { sha3_256 } from 'js-sha3';
import BigNumber from 'bignumber.js';
import { utils, config } from '@coolwallet/core';
import * as params from '../config/params';
import { Integer, Transaction } from '../config/types';

const getPath = (addressIndex=0) => {
  const slip10PathType = config.PathType.SLIP0010.toString();
  const path =
    slip10PathType +
    '8000002C' +
    params.COIN_TYPE +
    '80000000' +
    '80000000' +
    (Math.floor(addressIndex) + 0x80000000).toString(16);

  return path;
};

const publicKeyToAuthenticationKey = (publicKey: string) => {
  const publicKeyAndScheme = Buffer.concat([Buffer.from(publicKey, 'hex'), Buffer.alloc(1)]);
  const authenticationKey = sha3_256(publicKeyAndScheme);
  return authenticationKey;
};

function checkAddress(param: string) {
  const s = param.toLowerCase();
  const hex = s.startsWith('0x') ? s.slice(2) : s;
  const re = /^([0-9A-Fa-f]{2})+$/;
  const isHex = re.test(hex);
  const is32Bytes = hex.length === 64;
  if (isHex && is32Bytes) return hex;
  throw new Error('invalid address format');
}

function toU64Arg(param: Integer) {
  const bn = new BigNumber(param);
  const hex = bn.toString(16);
  const len = Math.ceil(hex.length/2)*2;
  return Buffer.from(hex.padStart(len, '0'),'hex').reverse().toString('hex').padEnd(16,'0');
}

function getScript(): string {
  return params.TRANSFER.script + params.TRANSFER.signature.padStart(144, '0');
}

function getArgument(tx: Transaction): string {
  const { keyIndex, sender, sequence, receiver, amount, gasLimit, gasPrice, expiration } = tx;

  const fullPath = utils.getFullPath({
    pathType: config.PathType.SLIP0010,
    pathString: `44'/637'/0'/0'/${keyIndex}'`,
  });
  let result = `15${fullPath}`; // length: 22 bytes
  result += checkAddress(sender);
  result += toU64Arg(sequence);
  result += checkAddress(receiver);
  result += toU64Arg(amount);
  result += toU64Arg(gasLimit);
  result += toU64Arg(gasPrice);
  result += toU64Arg(expiration);
  return result;
}

// Signed Transaction

function getSignedTx(tx: Transaction, sig: Buffer): string {
  return '';
}

export { getPath, publicKeyToAuthenticationKey, getScript, getArgument, getSignedTx };
