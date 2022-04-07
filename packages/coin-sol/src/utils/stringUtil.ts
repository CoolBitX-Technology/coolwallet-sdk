import { LAMPORTS_PER_SOL } from '../config/params';
import base58 from 'bs58';
const BN = require('bn.js');

export const isBase58Format = (value: string): boolean => {
  const match = value.match(/([G-Z])|([g-z])/g);
  return !!(match && match.length > 0);
};

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

export function transferDataEncode(amount: number | string): string {
  const data = Buffer.alloc(12);
  const programIdIndexSpan = 4;
  data.writeUIntLE(2, 0, programIdIndexSpan);
  const v2e32 = Math.pow(2, 32);
  const value = Number(amount) * LAMPORTS_PER_SOL;
  const hi32 = Math.floor(value / v2e32);
  const lo32 = value - hi32 * v2e32;
  data.writeUInt32LE(lo32, programIdIndexSpan);
  data.writeInt32LE(hi32, programIdIndexSpan + 4);
  return data.toString('hex');
}

export function splDataEncode(amount: number | string, decimals: number = 9): string {
  const data = Buffer.alloc(9);
  const programIdIndexSpan = 1;
  data.writeUIntLE(3, 0, programIdIndexSpan);
  const [round, decimal] = amount.toString().split('.');

  let value = Number(round) > 0 ? round : '';
  if (decimal) {
    value += decimal.charAt(decimals) ? decimal.split('').slice(0, decimals).join('') : decimal.padEnd(decimals, '0');
  } else {
    value = value + ''.padEnd(decimals, '0');
  }
  const valueHex = new BN(value).toString(16, 8 * 2);
  const valueBuf = Buffer.from(valueHex, 'hex').reverse();

  data.write(valueBuf.toString('hex'), programIdIndexSpan, 8, 'hex');
  return data.toString('hex');
}
