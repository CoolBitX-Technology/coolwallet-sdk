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
  let {
    info: { symbol },
  } = options;
  const {
    info: { decimals },
  } = options;
  const unit = formatHex((+decimals).toString(16));
  if (symbol.length > 7) {
    symbol = symbol.substring(0, 7);
  }
  const len = formatHex(symbol.length.toString(16));
  const sym = formatHex(Buffer.from(symbol, 'ascii').toString('hex'));
  return unit + len + sym.padEnd(14, '0') + removeHex0x(contractAddress);
}

export { getOfficialTokenByContractAddress, encodeTokenToSE };
