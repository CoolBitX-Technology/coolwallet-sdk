
import { error } from '@coolwallet/core';
import * as types from '../config/types';
const bs58check = require('bs58check')
const zencashjs = require('zencashjs')


const ZERO = Buffer.alloc(1, 0);

function toDER(x: Buffer): Buffer {
  let i = 0;
  while (x[i] === 0) ++i;
  if (i === x.length) return ZERO;
  x = x.slice(i);
  if (x[0] & 0x80) return Buffer.concat([ZERO, x], 1 + x.length);
  return x;
}

function encodeDerSig(signature: Buffer, hashType: Buffer): Buffer {
  const r = toDER(signature.slice(0, 32));
  const s = toDER(signature.slice(32, 64));
  return Buffer.concat([bip66Encode(r, s), hashType]);
}

function bip66Encode(r: Buffer, s: Buffer) {
  const lenR = r.length;
  const lenS = s.length;
  if (lenR === 0) {
    throw new error.SDKError(bip66Encode.name, 'R length is zero');
  }
  if (lenS === 0) {
    throw new error.SDKError(bip66Encode.name, 'S length is zero');
  }
  if (lenR > 33) {
    throw new error.SDKError(bip66Encode.name, 'R length is too long');
  }
  if (lenS > 33) {
    throw new error.SDKError(bip66Encode.name, 'S length is too long');
  }
  if (r[0] & 0x80) {
    throw new error.SDKError(bip66Encode.name, 'R value is negative');
  }
  if (s[0] & 0x80) {
    throw new error.SDKError(bip66Encode.name, 'S value is negative');
  }
  if (lenR > 1 && (r[0] === 0x00) && !(r[1] & 0x80)) {
    throw new error.SDKError(bip66Encode.name, 'R value excessively padded');
  }
  if (lenS > 1 && (s[0] === 0x00) && !(s[1] & 0x80)) {
    throw new error.SDKError(bip66Encode.name, 'S value excessively padded');
  }

  const signature = Buffer.allocUnsafe(6 + lenR + lenS);

  // 0x30 [total-length] 0x02 [R-length] [R] 0x02 [S-length] [S]
  signature[0] = 0x30;
  signature[1] = signature.length - 2;
  signature[2] = 0x02;
  signature[3] = r.length;
  r.copy(signature, 4);
  signature[4 + lenR] = 0x02;
  signature[5 + lenR] = s.length;
  s.copy(signature, 6 + lenR);

  return signature;
}
