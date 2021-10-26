// import { asciiToHex, padRight } from './lib';
import { handleHex, removeHex0x } from './stringUtil';
const Web3 = require('web3');

/**
 *
 * @param {String} contractAddress contract Address (0x prefixed)
 * @param {Number} decimals
 * @param {String} symbol
 * @return {String}
 */
export const getSetTokenPayload = (contractAddress: string, symbol: string, decimals: number): string => {
  const unit = handleHex(decimals.toString(16));
  if (symbol.length > 7) {
    symbol = symbol.substring(0, 7);
  }
  const len = handleHex(symbol.length.toString(16));
  const symb = handleHex(Web3.utils.asciiToHex(symbol));
  const setTokenPayload = unit + len + Web3.utils.padRight(symb, 14, '0') + removeHex0x(contractAddress);
  return setTokenPayload;
};
