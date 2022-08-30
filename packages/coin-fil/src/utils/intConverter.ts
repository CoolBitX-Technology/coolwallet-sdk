import BigNumber from 'bignumber.js';
import type { Integer } from '../config/types';

const re = /^([0-9A-Fa-f]{2})+$/;

function checkHexChar(hex: string) {
  if (hex === '' || re.test(hex)) return hex;
  throw new Error('invalid hex string');
}

function evenHexDigit(hex: string) {
  return hex.length % 2 !== 0 ? `0${hex}` : hex;
}

function removeHex0x(hex: string) {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

function handleHex(hex: string) {
  return checkHexChar(evenHexDigit(removeHex0x(hex)));
}

function bnToHex(bn: BigNumber, padStart = 0) {
  const hex = bn.toString(16);
  if (typeof padStart === 'number' && padStart > 0) {
    if (padStart * 2 < hex.length) throw new Error('argument is overlong!');
    return hex.padStart(padStart * 2, '0');
  }
  if (hex === '0') return '';
  return handleHex(hex);
}

function intToHex(i: Integer, padStart = 0) {
  bnToHex(new BigNumber(i), padStart);
}

function intToNum(i: Integer) {
  new BigNumber(i).toNumber();
}

function intToStr(i: Integer) {
  new BigNumber(i).toFixed();
}

export { handleHex, intToHex, intToNum, intToStr };
