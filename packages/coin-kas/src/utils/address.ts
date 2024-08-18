/*
MIT License

Copyright (c) 2023 OKX.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Modified by coolbitx in 2024
import { Payment, Script, ScriptType } from '../config/types';
import { decode, encode } from './base32';
import { checksumToArray, polymod } from './checksum';
import { convert } from './convertBits';
import { fromHex, getBitLength, prefixToArray } from './utils';
import { validate, validatePayment, validChecksum } from './validate';
import { error } from '@coolwallet/core';

export function toXOnly(pubKey: Buffer): Buffer {
  return pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);
}

export function getAddressByPublicKey(pubKey: string, prefix = 'kaspa') {
  const xOnlyPubKey = toXOnly(fromHex(pubKey)).toString('hex');
  const eight0 = [0, 0, 0, 0, 0, 0, 0, 0];
  const prefixData = prefixToArray(prefix).concat([0]);
  const versionByte = 0;

  const pubKeyArray = Array.prototype.slice.call(fromHex(xOnlyPubKey), 0);
  const payloadData = convert(new Uint8Array([versionByte].concat(pubKeyArray)), 8, 5, false);
  const checksumData = new Uint8Array(prefixData.length + payloadData.length + eight0.length);
  checksumData.set(prefixData);
  checksumData.set(payloadData, prefixData.length);
  checksumData.set(eight0, prefixData.length + payloadData.length);
  const polymodData = checksumToArray(polymod(checksumData));

  const payload = new Uint8Array(payloadData.length + polymodData.length);
  payload.set(payloadData);
  payload.set(polymodData, payloadData.length);
  return `${prefix}:` + encode(payload);
}

function getType(versionByte: number) {
  const type = versionByte & 120;
  validate(type !== 0, getType.name, 'Invalid address type in version byte:' + versionByte);
  return 'pubkey';
}

function hasSingleCase(string: string) {
  return string === string.toLowerCase() || string === string.toUpperCase();
}

export function decodeAddress(address: string) {
  validate(hasSingleCase(address), decodeAddress.name, 'Mixed case');
  address = address.toLowerCase();

  const pieces = address.split(':');
  validate(pieces.length === 2, decodeAddress.name, 'Invalid format: ' + address);

  const prefix = pieces[0];
  validate(prefix === 'kaspa', decodeAddress.name, 'Invalid prefix: ' + address);
  const encodedPayload = pieces[1];
  const payload = decode(encodedPayload);
  validate(validChecksum(prefix, payload), decodeAddress.name, 'Invalid checksum: ' + address);

  const convertedBits = convert(payload.slice(0, -8), 5, 8, true);
  const versionByte = convertedBits[0];
  const hashOrPublicKey = convertedBits.slice(1);
  const bitLength = getBitLength(hashOrPublicKey);

  if (versionByte === 1) {
    validate(bitLength === 264, decodeAddress.name, 'Invalid hash size: ' + address);
  } else {
    validate(bitLength === 256, decodeAddress.name, 'Invalid hash size: ' + address);
  }

  const type = getType(versionByte);

  return {
    payload: Buffer.from(hashOrPublicKey),
    prefix,
    type,
  };
}

function getScriptPublicKey(xOnlypublicKey: Buffer): Buffer {
  return Buffer.concat([Buffer.from([0x20]), xOnlypublicKey, Buffer.from([0xac])], 34);
}

export function addressToOutScript(address: string): Script {
  const { payload: xOnlyPublicKey } = decodeAddress(address);
  return {
    scriptType: ScriptType.P2PK,
    outScript: getScriptPublicKey(xOnlyPublicKey),
  };
}

export function pubkeyToPayment(publicKey: string, scriptType = ScriptType.P2PK): Payment {
  validate(scriptType === ScriptType.P2PK, pubkeyToPayment.name, `Unsupport ScriptType '${scriptType}'`);
  const payment: Payment = {
    address: getAddressByPublicKey(publicKey),
    outScript: getScriptPublicKey(Buffer.from(publicKey, 'hex')),
  };
  validatePayment(payment, pubkeyToPayment.name, scriptType);
  return payment;
}
