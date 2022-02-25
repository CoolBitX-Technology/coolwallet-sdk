const bitcore = require('bitcore-lib-cash');

export function hash160(buf: Buffer): Buffer {
  return bitcore.crypto.Hash.sha256ripemd160(buf);
}

export function doubleHash256(buf: Buffer): Buffer {
  return bitcore.crypto.Hash.sha256(bitcore.crypto.Hash.sha256(buf));
}
