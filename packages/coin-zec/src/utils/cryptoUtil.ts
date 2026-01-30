import * as bitcoin from 'bitcoinjs-lib';
import blake2b from 'blake2b';

export function hash160(buf: Buffer): Buffer {
  return bitcoin.crypto.hash160(buf);
}

export function hash256(buf: Buffer): Buffer {
  return bitcoin.crypto.hash256(buf);
}

export function blake2b256(input: Buffer): Buffer {
  const out = Buffer.allocUnsafe(32);
  const h = blake2b(32);
  h.update(input);
  h.digest(out);
  return out;
}

export function blake2b256Personal(input: Buffer, personalization: Buffer): Buffer {
  const out = Buffer.allocUnsafe(32);
  const h = blake2b(32, undefined, undefined, personalization);
  h.update(input);
  h.digest(out);
  return out;
}
