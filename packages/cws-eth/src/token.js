// import { apdu } from '@coolwallets/core';
import Web3 from 'web3';
import { handleHex, removeHex0x } from './string_util';

const web3 = new Web3();

/**
 * @param {string} data
 * @return {Boolean}
 */
export const isSupportedERC20Method = (data) => {
  const functionHash = data.slice(0, 8);
  if (functionHash === 'a9059cbb' || functionHash === '095ea7b3') return true;
  return false;
};

/**
 * Parse erc transfer amount and to address from data
 * @param {string} data
 */
export const parseToAndAmount = (data) => {
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
export const getSetTokenPayload = (contractAddress, symbol, decimals) => {
  const unit = handleHex(decimals.toString(16));
  const len = handleHex(symbol.length.toString(16));
  const symb = handleHex(web3.utils.asciiToHex(symbol));
  const setTokenPayload = unit + len + web3.utils.padRight(symb, 14, '0') + removeHex0x(contractAddress);
  return setTokenPayload;
};

/**
 * get Preaction
 * @param {Transport} transport
 * @param {boolean} isBuiltIn
 * @param {string} setTokenPayload
 * @return {Function}
 */
export const getSetTokenPreAction = (isBuiltIn, setTokenPayload) => {
  // if (isBuiltIn) {
  //   return async () => {
  //     await apdu.tx.setToken(transport, setTokenPayload);
  //   };
  // }
  // return async () => {
  //   await apdu.tx.setCustomToken(transport, setTokenPayload);
  // };
};
