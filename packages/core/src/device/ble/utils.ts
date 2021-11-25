import reduce from 'lodash/reduce';
import isEmpty from 'lodash/isEmpty';

/**
 * Convert number byte into hex string
 * @param {number} byte
 * @returns {string}
 */
export const byeToHex = (byte: number): string => (byte < 16 ? '0' : '') + byte.toString(16);

/**
 * Convert number byte array into hex string
 * @param {number[]} byteArray
 * @returns {string}
 */
export const byteArrayToHex = (byteArray: number[]): string => byteArray.map((byte) => byeToHex(byte)).join('');

/**
 * Convert hex string into number byte array
 * @param {string} hex
 * @returns {number[]}
 */
export const hexToByteArray = (hex: string): number[] => {
  if (isEmpty(hex)) return [];

  const chunk = hex.match(/.{2}/g);

  return reduce(
    chunk,
    (memo, curr) => {
      memo.push(parseInt(curr, 16));
      return memo;
    },
    [] as number[]
  );
};
