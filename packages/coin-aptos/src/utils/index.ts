/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { sha3_256 } from 'js-sha3';
import BigNumber from 'bignumber.js';
import { coin as COIN, Transport, utils, config } from '@coolwallet/core';
import * as params from '../config/params';
import { Integer, Transaction } from '../config/types';

function getPath(keyIndex: number) {
  const path = utils.getFullPath({
    pathType: config.PathType.SLIP0010,
    pathString: `44'/637'/${keyIndex}'/0'/0'`,
  });
  return path;
}

async function getPublicKeyByKeyIndex(transport: Transport, appId: string, appPrivateKey: string, keyIndex: number) {
  const path = getPath(keyIndex);
  const publicKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
  return publicKey;
}

function publicKeyToAuthenticationKey(publicKey: string) {
  const publicKeyAndScheme = new Uint8Array([...Buffer.from(publicKey, 'hex'), ...Buffer.alloc(1)]);
  const authenticationKey = sha3_256(publicKeyAndScheme);
  return authenticationKey;
}

function remove0x(param: string): string {
  if (!param) return '';
  const s = param.toLowerCase();
  return s.startsWith('0x') ? s.slice(2) : s;
}

function checkHex(param: string, strLen: number): string {
  const hex = remove0x(param);
  const re = /^([0-9A-Fa-f]{2})+$/;
  const isHex = re.test(hex);
  const validLength = hex.length === strLen;
  if (!isHex) throw new Error('invalid hex format');
  if (!validLength) throw new Error(`invalid length, need ${strLen}, get ${hex.length}`);
  return hex;
}

function toUintArg(param: Integer, byteLen: number): string {
  if (!param) {
    param = '0';
  }
  const bn = new BigNumber(param);
  const hex = bn.toString(16);
  const len = Math.ceil(hex.length / 2) * 2;
  return Buffer.from(hex.padStart(len, '0'), 'hex')
    .reverse()
    .toString('hex')
    .padEnd(byteLen * 2, '0');
}

function getScript(): string {
  return params.TRANSFER.script + params.TRANSFER.signature.padStart(144, '0');
}

function getArgument(tx: Transaction): string {
  const { keyIndex, sender, sequence, receiver, amount, gasLimit, gasPrice, expiration, chainId } = tx;

  const path = getPath(keyIndex);
  let result = `15${path}`;
  result += checkHex(sender, 64);
  result += toUintArg(sequence, 8);
  result += checkHex(receiver, 64);
  result += toUintArg(amount, 8);
  result += toUintArg(gasLimit, 8);
  result += toUintArg(gasPrice, 8);
  result += toUintArg(expiration, 8);
  result += toUintArg(chainId, 1);
  return result;
}

function getSignedTx(tx: Transaction, publicKey: string, sig?: string): string {
  const { sender, sequence, receiver, amount, gasLimit, gasPrice, expiration, chainId } = tx;

  let signedTx = '';
  signedTx += checkHex(sender, 64);
  signedTx += toUintArg(sequence, 8);
  signedTx += '02';
  signedTx += '0000000000000000000000000000000000000000000000000000000000000001';
  signedTx += '0d6170746f735f6163636f756e74';
  signedTx += '087472616e73666572';
  signedTx += '000220';
  signedTx += checkHex(receiver, 64);
  signedTx += '08';
  signedTx += toUintArg(amount, 8);
  signedTx += toUintArg(gasLimit, 8);
  signedTx += toUintArg(gasPrice, 8);
  signedTx += toUintArg(expiration, 8);
  signedTx += toUintArg(chainId, 1);
  signedTx += '0020';
  signedTx += checkHex(publicKey, 64);
  signedTx += '40';
  signedTx += sig ? checkHex(sig, 128) : '0'.repeat(128);
  return signedTx;
}

export { getPublicKeyByKeyIndex, publicKeyToAuthenticationKey, getScript, getArgument, getSignedTx };