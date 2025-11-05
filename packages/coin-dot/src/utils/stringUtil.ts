import * as types from '../config/types';
import * as checkUtil from './checkUtil';
import BN from 'bn.js';

const UNPREFIX_HEX_REGEX = /^[a-fA-F0-9]+$/;

const evenHexDigit = (hex: string) => (hex.length % 2 !== 0 ? `0${hex}` : hex);

export const removeHex0x = (hex: string) => (hex.slice(0, 2) === '0x' ? hex.slice(2) : hex);

export const handleHex = (hex: string) => evenHexDigit(removeHex0x(hex));

export function bnToBn<ExtToBn extends types.ToBn>(value?: ExtToBn | BN | bigint | string | number | null): BN {
  if (!value) {
    return new BN(0);
  } else if (checkUtil.isHex(value)) {
    return hexToBn(value.toString());
  } else if (checkUtil.isBigInt(value)) {
    return new BN(value.toString());
  }

  return numberToBn(value);
}

export function hexToBn(
  value?: string | number | null,
  options: types.ToBnOptions | boolean = { isLe: false, isNegative: false }
): BN {
  if (!value) {
    return new BN(0);
  }

  const _options: types.ToBnOptions = {
    isLe: false,
    isNegative: false,
    // Backwards-compatibility
    ...(checkUtil.isBoolean(options) ? { isLe: options } : options),
  };

  const _value = hexStripPrefix(value as string);

  // FIXME: Use BN's 3rd argument `isLe` once this issue is fixed
  // https://github.com/indutny/bn.js/issues/208
  const bn = new BN((_options.isLe ? reverse(_value) : _value) || '00', 16);

  // fromTwos takes as parameter the number of bits, which is the hex length
  // multiplied by 4.
  return _options.isNegative ? bn.fromTwos(_value.length * 4) : bn;
}

export function hexStripPrefix(value?: string | null): string {
  if (!value) {
    return '';
  }

  if (hexHasPrefix(value)) {
    return value.substr(2);
  }

  if (UNPREFIX_HEX_REGEX.test(value)) {
    return value;
  }

  throw new Error(`Invalid hex ${value} passed to hexStripPrefix`);
}

export function hexHasPrefix(value?: string | null): boolean {
  return !!(value && checkUtil.isHex(value, -1, true) && value.substr(0, 2) === '0x');
}

export function reverse(value: string): string {
  return (value.match(/.{1,2}/g) || []).reverse().join('');
}

export function numberToBn<ExtToBn extends types.ToBn>(value: number | ExtToBn | BN): BN {
  return BN.isBN(value) ? value : checkUtil.isToBn(value) ? value.toBn() : new BN(value);
}

export function paddingString(binaryString: string): string {
  if (binaryString.length % 2 != 0) {
    return '0' + binaryString;
  }
  return binaryString;
}

export function toHexString(value?: number): string | undefined {
  if (value === undefined) return undefined;
  return value.toString(16).padStart(2, '0');
}
