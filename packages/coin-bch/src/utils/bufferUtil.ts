import BN from 'bn.js';
import * as varuint from './varuint';

const ZERO = Buffer.alloc(1, 0);

export function toVarUintBuffer(int: number): Buffer {
  return varuint.encode(int);
}

export function toReverseUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
  const bn = new BN(numberOrString);
  const buf = Buffer.from(bn.toArray()).reverse();
  return Buffer.alloc(byteSize).fill(buf, 0, buf.length);
}

export function toUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
  const bn = new BN(numberOrString);
  const buf = Buffer.from(bn.toArray());
  return Buffer.alloc(byteSize).fill(buf, byteSize - buf.length, byteSize);
}
