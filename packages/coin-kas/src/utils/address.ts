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
import { AddressVersion, Payment, Script, ScriptType } from '../config/types';
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

export function getAddressByPublicKeyOrScriptHash(
  pubKeyOrScriptHash: string,
  version = AddressVersion.PUBKEY,
  prefix = 'kaspa'
): string {
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
      throw new error.SDKError(getType.name, 'Invalid address type with version:' + versionByte);
  }
}

function hasSingleCase(string: string) {
  return string === string.toLowerCase() || string === string.toUpperCase();
}

export function decodeAddressVersion(address: string): number {
  validate(hasSingleCase(address), decodeAddressVersion.name, 'Mixed case');
  address = address.toLowerCase();

  const pieces = address.split(':');
  validate(pieces.length === 2, decodeAddressVersion.name, 'Invalid format: ' + address);

  const prefix = pieces[0];
  validate(prefix === 'kaspa', decodeAddressVersion.name, 'Invalid prefix: ' + address);
  const encodedPayload = pieces[1];
  const payload = decode(encodedPayload);
  validate(validChecksum(prefix, payload), decodeAddressVersion.name, 'Invalid checksum: ' + address);

  const convertedBits = convert(payload.slice(0, -8), 5, 8, true);
  return convertedBits[0];
}

export function decodeAddress(address: string) {
  const addressVersion = decodeAddressVersion(address);
  const pieces = address.split(':');
  const prefix = pieces[0];
  const encodedPayload = pieces[1];
  const payload = decode(encodedPayload);

  const convertedBits = convert(payload.slice(0, -8), 5, 8, true);
  const hashOrPublicKey = convertedBits.slice(1);
  const byteLength = getBitLength(hashOrPublicKey) / 8;

  const expectedByteLength = addressVersion === 1 ? 33 : 32;
  if (addressVersion === 0 || addressVersion === 1 || addressVersion === 8) {
    validate(
      byteLength === expectedByteLength,
      decodeAddress.name,
      `Invalid hash or public key byteLength: ${byteLength}, version: ${addressVersion}`
    );
  } else {
    throw new error.SDKError(decodeAddress.name, `Unsupported version: ${addressVersion} with address:${address}`);
  }

  const type = getType(addressVersion);

  const hashOrPublicKeyBuffer = Buffer.from(hashOrPublicKey);
  validate(
    getAddressByPublicKeyOrScriptHash(hashOrPublicKeyBuffer.toString('hex'), addressVersion) === address,
    decodeAddress.name,
    'Wrong public key from address: ' + address
  );

  return {
    payload: hashOrPublicKeyBuffer,
    prefix,
    type,
    addressVersion,
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

function getScriptPublicKey(publicKeyOrScripthash: Buffer, addressVersion: AddressVersion): Buffer {
  const endingOpCode = getEndingOpCode(addressVersion);
  const length = publicKeyOrScripthash.length;
  const lengthByte = Buffer.from([length]);
  switch (addressVersion) {
    case 0:
    case 1:
      return Buffer.concat([lengthByte, publicKeyOrScripthash, endingOpCode], length + 2);
    case 8:
      const prefixOpCode = Buffer.from([OP_CODE.OP_HASH256]);
      return Buffer.concat([prefixOpCode, lengthByte, publicKeyOrScripthash, endingOpCode], length + 3);
    default:
      throw new Error(`Unsupported payToAddrScript address version: ${addressVersion}`);
  }
}

export function addressToOutScript(address: string): Script {
  const { payload: publicKeyOrScripthash, addressVersion } = decodeAddress(address);
  return {
    scriptType: getScriptType(addressVersion),
    outScript: getScriptPublicKey(publicKeyOrScripthash, addressVersion),
    outHash: addressVersion === 8 ? publicKeyOrScripthash : undefined,
  };
}

export function getScriptType(addressVersion: AddressVersion): ScriptType {
  switch (addressVersion) {
    case AddressVersion.PUBKEY:
      return ScriptType.P2PK_SCHNORR;
    case AddressVersion.PUBKEY_ECDSA:
      return ScriptType.P2PK_ECDSA;
    case AddressVersion.SCRIPT_HASH:
      return ScriptType.P2SH;
    default:
      throw new error.SDKError(getScriptType.name, `Unsupported addressVersion: ${addressVersion}`);
  }
}

export function getAddressVersion(scriptType: ScriptType): AddressVersion {
  switch (scriptType) {
    case ScriptType.P2PK_SCHNORR:
      return AddressVersion.PUBKEY;
    case ScriptType.P2PK_ECDSA:
      return AddressVersion.PUBKEY_ECDSA;
    case ScriptType.P2SH:
      return AddressVersion.SCRIPT_HASH;
    default:
      throw new error.SDKError(getAddressVersion.name, `Unsupported scriptType: ${scriptType}`);
  }
}

export function getPubkeyOrScriptHash(
  scriptType: ScriptType,
  publicKey: string | Buffer
): { pubkeyOrScriptHash: string; addressVersion: AddressVersion } {
  const pubkeyHex = Buffer.isBuffer(publicKey) ? publicKey.toString('hex') : publicKey;
  const addressVersion = getAddressVersion(scriptType);
  switch (scriptType) {
    case ScriptType.P2PK_ECDSA:
      return {
        pubkeyOrScriptHash: pubkeyHex,
        addressVersion,
      };
    case ScriptType.P2PK_SCHNORR:
      return {
        pubkeyOrScriptHash: toXOnly(pubkeyHex),
        addressVersion,
      };
    default:
      throw new error.SDKError(getPubkeyOrScriptHash.name, `Unsupported scriptType: ${scriptType}, publicKey: ${pubkeyHex}`);
  }
}

export function pubkeyOrScriptHashToPayment(publicKeyOrScriptHash: string, addressVersion: AddressVersion): Payment {
  const address = getAddressByPublicKeyOrScriptHash(publicKeyOrScriptHash, addressVersion);
  const outScript = getScriptPublicKey(Buffer.from(publicKeyOrScriptHash, 'hex'), addressVersion);
  const payment: Payment = {
    address,
    outScript,
  };
  validatePayment(payment, pubkeyOrScriptHashToPayment.name, addressVersion);
  return payment;
}
