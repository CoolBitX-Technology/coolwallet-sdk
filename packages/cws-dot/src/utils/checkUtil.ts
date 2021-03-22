
import * as types from '../config/types'

const HEX_REGEX = /^0x[a-fA-F0-9]+$/;

export function isHex(value: unknown, bitLength = -1, ignoreLength = false): value is string | String {
  const isValidHex = value === '0x' || (isString(value) && HEX_REGEX.test(value.toString()));

  if (isValidHex && bitLength !== -1) {
    return (value as string).length === (2 + Math.ceil(bitLength / 4));
  }

  return isValidHex && (ignoreLength || ((value as string).length % 2 === 0));
}

export function isString(value: unknown): value is string | String {
  return typeof value === 'string' || value instanceof String;
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isBigInt(value: unknown): value is BigInt {
  return typeof value === 'bigint';
}

export function isToBn(value?: unknown): value is types.ToBn {
  return !!value && isFunction((value as types.ToBn).toBn);
}

export function isFunction(value: unknown): value is types.FnType {
  return typeof value === 'function';
}
