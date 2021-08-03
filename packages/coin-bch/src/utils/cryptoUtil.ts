import { transport, tx, apdu } from '@coolwallet/core';
const bitcore = require('bitcore-lib-cash');
const bchaddr = require('bchaddrjs');

export function hash160(buf: Buffer): Buffer {
  return bitcore.crypto.Hash.sha256ripemd160(buf);
}

export function doubleHash256(buf: Buffer): Buffer {
  return bitcore.crypto.Hash.sha256(bitcore.crypto.Hash.sha256(buf));
}
