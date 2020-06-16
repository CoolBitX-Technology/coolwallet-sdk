import { asciiToHex, padRight } from './lib';
import { handleHex, removeHex0x } from './utils/stringUtil';

/**
 * @param {string} data
 * @return {Boolean}
 */
export const isSupportedERC20Method = (data: string): boolean => {
  const functionHash = data.slice(0, 8);
  if (functionHash === 'a9059cbb' || functionHash === '095ea7b3') return true;
  return false;
};

/**
 * Parse erc transfer amount and to address from data
 * @param {string} data
 */
export const parseToAndAmount = (data: string) => {
  const params = data.slice(8);
  const to = params.slice(0, 64).slice(24); // last 20 bytes
  const amount = params.slice(64).slice(40); // last 12 bytes
  return { to, amount };
};

/**
 *
 * @param {String} contractAddress contract Address (0x prefixed)
 * @param {Number} decimals
 * @param {String} symbol
 * @return {String}
 */
export const getSetTokenPayload = (contractAddress: string, symbol: string, decimals: number): string => {
  const unit = handleHex(decimals.toString(16));
  const len = handleHex(symbol.length.toString(16));
  const symb = handleHex(asciiToHex(symbol));
  const setTokenPayload = unit + len + padRight(symb, 14, '0') + removeHex0x(contractAddress);
  return setTokenPayload;
};

/**
 * get Preaction
 * @param {Transport} transport
 * @param {boolean} isBuiltIn
 * @param {string} setTokenPayload
 * @return {Function}
 */
// export const getSetTokenPreAction = (isBuiltIn, setTokenPayload) => {
  // if (isBuiltIn) {
  //   return async () => {
  //     await apdu.tx.setToken(transport, setTokenPayload);
  //   };
  // }
  // return async () => {
  //   await apdu.tx.setCustomToken(transport, setTokenPayload);
  // };
// };
