import reduce from "lodash/reduce";
import isEmpty from "lodash/isEmpty";

/**
 * Convert number byte into hex string
 * @param {number} byte
 * @returns {string}
 */
const byteToHex = (byte: number): string =>
  (byte < 16 ? "0" : "") + byte.toString(16);

/**
 * Convert number byte array into hex string
 * @param {number[]} byteArray
 * @returns {string}
 */
const byteArrayToHex = (byteArray: number[]): string =>
  byteArray.map((byte) => byteToHex(byte)).join("");

/**
 * Convert hex string into number byte array
 * @param {string} hex
 * @returns {number[]}
 */
const hexToByteArray = (hex: string): number[] => {
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

export { byteArrayToHex, hexToByteArray };
