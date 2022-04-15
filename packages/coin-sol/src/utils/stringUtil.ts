import base58 from 'bs58';
const BN = require('bn.js');

export const isBase58Format = (value?: string): boolean => {
  if (!value) return false;
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
