import BN from 'bn.js';
/**
 * Expand hex string length to even.
 *
 * @param hex Hex string
 * @returns
 */
function evenHexDigit(hex: string): string {
  return hex.length % 2 !== 0 ? `0${hex}` : hex;
}

/**
 * Remove leading '0x' prefix
 *
 * @param hex Hex string
 * @returns
 */
export function removeHex0x(hex: string): string {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

/**
 * Remove leading zero and even hex string
 *
 * @param hex Hex string
 * @returns
 */
function formatHex(hex: string) {
  return evenHexDigit(removeHex0x(hex));
}

function numberToHex(hex: string) {
  const number = new BN(hex, 'hex');
  const result = number.toString(16);

  return number.lt(new BN(0)) ? '-0x' + result.substr(1) : '0x' + result;
}

function utf8ToHex(value: string) {
  return Buffer.from(value, 'utf-8').toString('hex');
}

function ToHex(value: string) {
  if (typeof value === 'string') {
    if (value.indexOf('-0x') === 0 || value.indexOf('-0X') === 0) {
      return numberToHex(value);
    } else if (value.indexOf('0x') === 0 || value.indexOf('0X') === 0) {
      return value;
    } else if (!isFinite(+value)) {
      return utf8ToHex(value);
    }
  }

  return numberToHex(value);
}

export { formatHex, ToHex };
