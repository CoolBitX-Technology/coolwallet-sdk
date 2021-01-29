import BN from 'bn.js';


export function toVarUintBuffer(value: number): Buffer {
  const hex = value.toString(16);
  return Buffer.from(hex.length % 2 !== 0 ? `0${hex}` : hex, 'hex')
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

export function hexStringToUintBuffer(string: string, byteSize: number, encode?: string): Buffer {
  const bn = new BN(string, 'hex');
  const buf = Buffer.from(bn.toArray());
  return Buffer.alloc(byteSize).fill(buf, byteSize - buf.length, byteSize);
}
