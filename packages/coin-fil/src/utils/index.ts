/* eslint-disable @typescript-eslint/no-var-requires */
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const base32 = require('base32.js');

import { utils, config } from '@coolwallet/core';
import blake2b from 'blakejs';
import * as configParams from '../config/params';
import type { Integer, InputTransaction, RawTransaction, SignedTransaction } from '../config/types';
import { handleHex, intToHex, intToNum, intToStr } from './intConverter';
import {
  getCborPrefix,
  getAddrField,
  getUintField,
  getBigNumberField,
  getAddrArgs,
  getUintArgs,
  getBigNumberArgs,
  getSmartArgs
} from './argEncoder';

export function pubKeyToAddress(compressedPubkey: string): string {
  const uncompressedKey = ec.keyFromPublic(compressedPubkey, 'hex').getPublic(false, 'hex');
  const payload = blake2b.blake2bHex(Buffer.from(uncompressedKey,'hex'), undefined, 20);
  const protocol = '01';
  const bytesAddress = protocol + payload;

  const checksum = blake2b.blake2bHex(Buffer.from(bytesAddress, 'hex'), undefined, 4);
  const data = Buffer.from(payload+checksum, 'hex');
  const encoder = new base32.Encoder();
  const stringAddress =  'f' + parseInt(protocol, 16) + encoder.write(data).finalize().toLowerCase();
  return stringAddress;
}

export function getScript() {
  const param = configParams.Transaction;
  return param.script + param.signature.padStart(144, '0');
}

export function getArguments(tx: InputTransaction, compressedPubkey: string) {
  const uncompressedKey = ec.keyFromPublic(compressedPubkey, 'hex').getPublic(false, 'hex');
  const fromPayload = blake2b.blake2bHex(Buffer.from(uncompressedKey,'hex'), undefined, 20);

  const { addressIndex, to, nonce, value, gasLimit, gasFeeCap, gasPremium, method, params } = tx;

  const fullPath = utils.getFullPath({
    pathType: config.PathType.BIP32,
    pathString: `44'/461'/0'/0/${addressIndex}`,
  });
  let result = `15${fullPath}`; // length: 22 bytes

  const toAddrArgs = getAddrArgs(to);
  const nonceArgs = getUintArgs(nonce);
  const valueArgs = getBigNumberArgs(value);
  let gasArgs = getUintField(gasLimit);
  gasArgs += getBigNumberField(gasFeeCap);
  gasArgs += getBigNumberField(gasPremium);
  const gasArgsLength = (gasArgs.length/2).toString(16).padStart(2,'0');

  result += toAddrArgs + fromPayload + nonceArgs + valueArgs + gasArgsLength + gasArgs.padEnd(80,'0');

  if (method && params) {
    const smartExist = '01';
    const smartArgs = getSmartArgs(method, params);
    result += smartExist + smartArgs;
  }
  return result;
}

// 8a (Array)
//   00 (Uint)
//   55 (Byte) 01e10e644ce8f5a28e19d11a8d0e7b5b561ccecdb9
//   55 (Byte) 01347aa4d721acf77d2c2a75948fcf5b2d242868b5
//   01 (Uint)
//   4a (Byte) 00056bc75e2d63100000
//   1a (Uint) 00095501
//   44 (Byte) 0001894a
//   44 (Byte) 0001852c
//   00 (Uint)
//   40 (Byte)

function genRawTransaction(tx: RawTransaction): string {
  const { To, From, Nonce, Value, GasLimit, GasFeeCap, GasPremium, Method, Params } = tx;

  let rawTx = '8a00';
  rawTx += getAddrField(To);
  rawTx += getAddrField(From);
  rawTx += getUintField(Nonce);
  rawTx += getBigNumberField(Value);
  rawTx += getUintField(GasLimit);
  rawTx += getBigNumberField(GasFeeCap);
  rawTx += getBigNumberField(GasPremium);
  rawTx += getSmartArgs(Method, Params);

  return rawTx;
}

function getSigWithParam(rawTxBuf: Buffer, compressedPubkey: string, sig: { r: string; s: string }) {
  const hash = blake2b.blake2bHex(rawTxBuf, undefined, 32);
  const hashBuf = Buffer.from(handleHex(hash), 'hex');
  const cidBuf = Buffer.concat([Buffer.from('0171a0e40220', 'hex'), hashBuf]);
  const cidHash = blake2b.blake2bHex(cidBuf, undefined, 32);
  const cidHashBuf = Buffer.from(handleHex(cidHash), 'hex');
  const keyPair = ec.keyFromPublic(compressedPubkey, 'hex');
  const recoveryParam = ec.getKeyRecoveryParam(cidHashBuf, sig, keyPair.pub);
  return sig.r + sig.s + recoveryParam.toString(16).padStart(2, '0');
}

function integerToString(num: Integer) {
  return typeof num === 'number' ? num.toString() : num;
}

function integerToNumber(num: Integer) {
  return typeof num === 'number' ? num : parseInt(num);
}

export function getSignedTransaction(
  tx: InputTransaction,
  sig: { r: string; s: string },
  compressedPubkey: string,
) {
  const { addressIndex, to, nonce, value, gasLimit, gasFeeCap, gasPremium, method, params } = tx;

  const Message = {
    To: to,
    From: pubKeyToAddress(compressedPubkey),
    Nonce: integerToNumber(nonce),
    Value: integerToString(value),
    GasLimit: integerToNumber(gasLimit),
    GasFeeCap: integerToString(gasFeeCap),
    GasPremium: integerToString(gasPremium),
    Method: (method) ? integerToNumber(method) : 0,
    Params: (params) ? integerToString(params) : '',
  };

  const rawTx = genRawTransaction(Message);
  const signature = getSigWithParam(Buffer.from(rawTx, 'hex'), compressedPubkey, sig);

  const signedTx = {
    Message,
    Signature: {
      Type: 1,
      Data: Buffer.from(signature, 'hex').toString('base64')
    }
  };
  return signedTx;
}
