import * as bitcoin from 'bitcoinjs-lib';
import blake2b from 'blake2b';

export function hash160(buf: Buffer): Buffer {
  return bitcoin.crypto.hash160(buf);
}

export function hash256(buf: Buffer): Buffer {
  return bitcoin.crypto.hash256(buf);
}

export function blake2b256(input: Buffer): Buffer {
  const outBytes = new Uint8Array(32);
  const h = blake2b(32);
  h.update(Uint8Array.from(input));
  h.digest(outBytes);
  return Buffer.from(outBytes);
}

export function blake2b256Personal(input: Buffer, personalization: Buffer): Buffer {
  const inputBytes = Uint8Array.from(input);
  const personalBytes = Uint8Array.from(personalization);
  const outBytes = new Uint8Array(32);

  const h = blake2b(32, undefined, undefined, personalBytes);
  h.update(inputBytes);
  h.digest(outBytes);
  return Buffer.from(outBytes);
}
