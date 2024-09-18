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
import { error } from '@coolwallet/core';
import { Payment, Script, ScriptType } from '../config/types';
import { decode, encode } from './base32';
import { checksumToArray, polymod } from './checksum';
import { convert } from './convertBits';
import { fromHex, getBitLength, prefixToArray } from './utils';
import { validate, validatePayment, validChecksum } from './validate';

export function toXOnly(pubKey: Buffer | string): string {
  if (typeof pubKey === 'string') {
    pubKey = Buffer.from(pubKey, 'hex');
  }
  const result = pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);
  return result.toString('hex');
}

export function getAddressByPublicKeyOrScriptHash(pubKeyOrScriptHash: string, version = 0, prefix = 'kaspa'): string {
  const eight0 = [0, 0, 0, 0, 0, 0, 0, 0];
  const prefixData = prefixToArray(prefix).concat([0]);

  if (version === 0 || version === 8) {
    validate(
      pubKeyOrScriptHash.length === 64,
      getAddressByPublicKeyOrScriptHash.name,
      `Invalid pubkey hex length: ${pubKeyOrScriptHash.length}`
    );
  } else if (version === 1) {
    validate(
      pubKeyOrScriptHash.length === 66,
      getAddressByPublicKeyOrScriptHash.name,
      `Invalid pubkey hex length: ${pubKeyOrScriptHash.length}`
    );
  } else {
    throw new error.SDKError(getAddressByPublicKeyOrScriptHash.name, `Unsupported version: ${version}`);
  }

  const pubKeyArray = Array.prototype.slice.call(fromHex(pubKeyOrScriptHash), 0);
  const payloadData = convert(new Uint8Array([version].concat(pubKeyArray)), 8, 5, false);
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
  switch (versionByte & 120) {
    case 0:
      return 'pubkey';
    case 8:
      return 'scripthash';
    default:
      throw new error.SDKError(getType.name,'Invalid address type with version:' + versionByte);
  }
}

function hasSingleCase(string: string) {
  return string === string.toLowerCase() || string === string.toUpperCase();
}

export function getVersionByAddress(address: string): number {
  validate(hasSingleCase(address), getVersionByAddress.name, 'Mixed case');
  address = address.toLowerCase();

  const pieces = address.split(':');
  validate(pieces.length === 2, getVersionByAddress.name, 'Invalid format: ' + address);

  const prefix = pieces[0];
  validate(prefix === 'kaspa', getVersionByAddress.name, 'Invalid prefix: ' + address);
  const encodedPayload = pieces[1];
  const payload = decode(encodedPayload);
  validate(validChecksum(prefix, payload), getVersionByAddress.name, 'Invalid checksum: ' + address);

  const convertedBits = convert(payload.slice(0, -8), 5, 8, true);
  return convertedBits[0];
}

export function decodeAddress(address: string) {
  const version = getVersionByAddress(address);
  const pieces = address.split(':');
  const prefix = pieces[0];
  const encodedPayload = pieces[1];
  const payload = decode(encodedPayload);

  const convertedBits = convert(payload.slice(0, -8), 5, 8, true);
  const hashOrPublicKey = convertedBits.slice(1);
  const byteLength = getBitLength(hashOrPublicKey) / 8;

  const expectedByteLength = version === 1 ? 33 : 32;
  if (version === 0 || version === 1 || version === 8) {
    validate(
      byteLength === expectedByteLength,
      decodeAddress.name,
      `Invalid hash or public key byteLength: ${byteLength}, version: ${version}`
    );
  } else {
    throw new error.SDKError(decodeAddress.name, `Unsupported version: ${version} with address:${address}`);
  }

  const type = getType(version);

  const hashOrPublicKeyBuffer = Buffer.from(hashOrPublicKey);
  validate(
    getAddressByPublicKeyOrScriptHash(hashOrPublicKeyBuffer.toString('hex'), version) === address,
    decodeAddress.name,
    'Wrong public key from address: ' + address
  );

  return {
    payload: hashOrPublicKeyBuffer,
    prefix,
    type,
    version,
  };
}

enum OP_CODE {
  OP_CHECKSIG = 0xac,
  OP_CODESEPARATOR = 0xab,
  OP_EQUAL = 0x87,
  OP_HASH256 = 0xaa,
}

function getEndingOpCode(version: number) {
  switch (version) {
    case 0:
      return Buffer.from([OP_CODE.OP_CHECKSIG]);
    case 1:
      return Buffer.from([OP_CODE.OP_CODESEPARATOR]);
    case 8:
      return Buffer.from([OP_CODE.OP_EQUAL]);
    default:
      throw new Error(`Unsupport getEndingOpCode version: ${version}`);
  }
}

function getScriptPublicKey(publicKeyOrScripthash: Buffer, version: number): Buffer {
  const endingOpCode = getEndingOpCode(version);
  const length = publicKeyOrScripthash.length;
  const lengthByte = Buffer.from([length]);
  switch (version) {
    case 0:
    case 1:
      return Buffer.concat([lengthByte, publicKeyOrScripthash, endingOpCode], length + 2);
    case 8:
      const prefixOpCode = Buffer.from([OP_CODE.OP_HASH256]);
      return Buffer.concat([prefixOpCode, lengthByte, publicKeyOrScripthash, endingOpCode], length + 3);
    default:
      throw new Error(`Unsupported payToAddrScript version: ${version}`);
  }
}

export function addressToOutScript(address: string): Script {
  const { payload: publicKeyOrScripthash, version } = decodeAddress(address);
  return {
    scriptType: version,
    outScript: getScriptPublicKey(publicKeyOrScripthash, version),
    outHash: version === 8 ? publicKeyOrScripthash : undefined,
  };
}

export function pubkeyOrScriptHashToPayment(publicKeyOrScriptHash: string, scriptType: ScriptType): Payment {
  const payment: Payment = {
    address: getAddressByPublicKeyOrScriptHash(publicKeyOrScriptHash, scriptType),
    outScript: getScriptPublicKey(Buffer.from(publicKeyOrScriptHash, 'hex'), scriptType),
  };
  validatePayment(payment, pubkeyOrScriptHashToPayment.name, scriptType);
  return payment;
}
