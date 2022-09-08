/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { sha3_256 } from 'js-sha3';
import BigNumber from 'bignumber.js';
import { coin as COIN, Transport, utils, config } from '@coolwallet/core';
import * as params from '../config/params';
import { Integer, Transaction } from '../config/types';


// Account

function getPath(keyIndex: number) {
  const path = utils.getFullPath({
    pathType: config.PathType.SLIP0010,
    pathString: `44'/637'/0'/0'/${keyIndex}'`,
  });
  return path;
}

export async function getPublicKeyByKeyIndex(
  transport: Transport, appId: string, appPrivateKey: string, keyIndex: number
) {
  const path = getPath(keyIndex);
  const publicKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
  return publicKey;
}

export function publicKeyToAuthenticationKey(publicKey: string) {
  const publicKeyAndScheme = Buffer.concat([Buffer.from(publicKey, 'hex'), Buffer.alloc(1)]);
  const authenticationKey = sha3_256(publicKeyAndScheme);
  return authenticationKey;
}


// Signing Transaction

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

export function getScript(): string {
  return params.TRANSFER.script + params.TRANSFER.signature.padStart(144, '0');
}

export function getArgument(tx: Transaction): string {
  const { keyIndex, sender, sequence, receiver, amount, gasLimit, gasPrice, expiration } = tx;

  const path = getPath(keyIndex);
  let result = `15${path}`;
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

export function getSignedTx(tx: Transaction, sig: string, publicKey: string): string {
  const { sender, sequence, receiver, amount, gasLimit, gasPrice, expiration } = tx;

  let signedTx = '';
  signedTx += checkAddress(sender);
  signedTx += toU64Arg(sequence);
  signedTx += '02';
  signedTx += '0000000000000000000000000000000000000000000000000000000000000001';
  signedTx += '0d6170746f735f6163636f756e74';
  signedTx += '087472616e73666572';
  signedTx += '000220';
  signedTx += checkAddress(receiver);
  signedTx += '08';
  signedTx += toU64Arg(amount);
  signedTx += toU64Arg(gasLimit);
  signedTx += toU64Arg(gasPrice);
  signedTx += toU64Arg(expiration);
  signedTx += '19';
  signedTx += '0020';
  signedTx += publicKey;
  signedTx += '40';
  signedTx += sig;
  return signedTx;
}
