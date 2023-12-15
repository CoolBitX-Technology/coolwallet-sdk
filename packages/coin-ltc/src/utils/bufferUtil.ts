import BN from 'bn.js';
import * as varuint from './varuint';
const base58 = require('bs58');

export function toVarUintBuffer(int: number): Buffer {
  return varuint.encode(int);
}

export function toUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
  const bn = new BN(numberOrString);
  const buf = Buffer.from(bn.toArray()).reverse();
  return Buffer.alloc(byteSize).fill(buf, 0, buf.length);
}

export function toNonReverseUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
  const bn = new BN(numberOrString);
  const buf = Buffer.from(bn.toArray());
  return Buffer.alloc(byteSize).fill(buf, byteSize - buf.length, byteSize);
}
