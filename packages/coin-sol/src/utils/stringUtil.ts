import base58 from 'bs58';
import BN from 'bn.js';
import * as types from '../config/types';
import { ComputeBudgetInstruction } from '../config/types';

const HEX_REGEX = /[0-9A-Fa-f]{6}/g;

export const isBase58Format = (value?: string): boolean => {
  if (!value) return false;
  return /^[A-HJ-NP-Za-km-z1-9]*$/.test(value);
};

function isHexFormat(value: string): boolean {
  const match = value.match(HEX_REGEX);
  return !!match;
}

export function toBase58(publicKey: types.Address): string {
  if (typeof publicKey === 'string') {
    if (isBase58Format(publicKey)) return publicKey;
    if (isHexFormat(publicKey)) return base58.encode(Buffer.from(publicKey, 'hex'));
    return publicKey;
  }
  return base58.encode(publicKey);
}

export function toBase58Buffer(publicKey: types.Address): Buffer {
  if (typeof publicKey === 'string') {
    if (isBase58Format(publicKey)) return base58.decode(publicKey);
    if (isHexFormat(publicKey)) return Buffer.from(publicKey, 'hex');
    return Buffer.from(publicKey);
  }
  return publicKey;
}

export function toPublicKey(publicKey: string | Buffer): string {
  if (typeof publicKey === 'string') return publicKey;
  return base58.encode(publicKey);
}

export function pubKeyToAddress(publicKey: string): string {
  const pubKeyBuf = Buffer.from(publicKey, 'hex');
  return base58.encode(pubKeyBuf);
}

export const formHex = (address: string | Buffer | undefined): string => {
  if (!address) return '';
  if (typeof address === 'string') {
    if (isBase58Format(address)) return base58.decode(address).toString('hex');
    return address;
  }
  return address.toString('hex');
};

export const numberToStringHex = (value: number | number[], pad: number): string =>
  Buffer.from(typeof value === 'number' ? [value] : value)
    .toString('hex')
    .padStart(pad, '0');

export const encodeLength = (bytes: number[], len: number): void => {
  let rem_len = len;
  for (;;) {
    let elem = rem_len & 0x7f;
    rem_len >>= 7;
    if (rem_len == 0) {
      bytes.push(elem);
      break;
    } else {
      elem |= 0x80;
      bytes.push(elem);
    }
  }
};

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

export function computeBudgetEncode(type: ComputeBudgetInstruction, amount: number | string): Buffer {
  let data;
  let length;
  switch (type) {
    case ComputeBudgetInstruction.SetComputeUnitLimit:
      data = Buffer.alloc(5);
      length = 4;
      break;
    case ComputeBudgetInstruction.SetComputeUnitPrice:
      data = Buffer.alloc(9);
      length = 8;
      break;
    default:
      throw new Error('Not supported ComputeBudgetInstruction type: ' + type);
  }

  const typeSpan = 1;
  data.writeUIntLE(type, 0, typeSpan);
  const valueBuf = toReverseUintBuffer(amount, length);
  data.write(valueBuf.toString('hex'), typeSpan, length, 'hex');

  return data;
}

export function splDataEncode(amount: number | string, tokenDecimals: number | string): Buffer {
  const data = Buffer.alloc(10);
  const programIdIndexSpan = 1;
  data.writeUIntLE(types.TokenInstruction.TransferChecked, 0, programIdIndexSpan);

  const valueHex = new BN(amount).toString(16, 8 * 2);
  const valueBuf = Buffer.from(valueHex, 'hex').reverse();

  data.write(valueBuf.toString('hex'), programIdIndexSpan, 8, 'hex');
  data.writeUInt8(+tokenDecimals, 9);
  return data;
}
