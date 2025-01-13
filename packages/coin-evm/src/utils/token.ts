import isNil from 'lodash/isNil';
import { formatHex, removeHex0x } from './string';
import type { Option } from '../transaction/types';
import type { ChainProps } from '../chain/types';

function getOfficialTokenByContractAddress(to: string, chain: ChainProps) {
  const contractAddress = to.toUpperCase();
  const tokens = Object.values(chain.tokens);

  // traversing whether `to` is a erc20 contractAddress
  for (const token of tokens) {
    if (token.contractAddress.toUpperCase() === contractAddress) {
      return token;
    }
  }

  return null;
}

/**
 * Encode a erc20 token to SE argument.
 *
 * @param {String} contractAddress contract Address (0x prefixed)
 * @param {Number} decimals
 * @param {String} symbol
 * @return {String}
 */
function encodeTokenToSE(contractAddress: string, options?: Option): string {
  if (isNil(options)) return '';

  const symbol = options.info.symbol;
  const decimals = options.info.decimals;

  let symbolFirst7Chars = symbol;
  if (symbol.length > 7) {
    symbolFirst7Chars = symbol.substring(0, 7);
  }

  const decimalHex1 = formatHex((+decimals).toString(16));
  const symbolLenHex1 = formatHex(symbolFirst7Chars.length.toString(16));
  const symbolHex7 = formatHex(Buffer.from(symbolFirst7Chars, 'ascii').toString('hex'));
  const contractAddressHex20 = removeHex0x(contractAddress);
  return decimalHex1 + symbolLenHex1 + symbolHex7.padEnd(14, '0') + contractAddressHex20;
}

export { getOfficialTokenByContractAddress, encodeTokenToSE };
