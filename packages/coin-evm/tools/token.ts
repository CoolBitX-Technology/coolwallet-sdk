import { OKX, ZKSYNC } from '../src/chain';
import { TokenProps } from '../src/chain/types';

const buildTokenHex = (token: TokenProps) => {
  const unitHex = (+token.unit).toString(16).padStart(2, '0');
  const symbolLengthHex = token.symbol.length.toString(16).padStart(2, '0');
  const symbolHex = Buffer.from(token.symbol).toString('hex').padEnd(14, '0');
  const address = token.contractAddress.startsWith('0x') ? token.contractAddress.slice(2) : token.contractAddress;

  return `${unitHex}${symbolLengthHex}${symbolHex}${address}`;
};

console.log('OKX USDT: ', buildTokenHex(OKX.tokens.USDT));
console.log('OKX USDC: ', buildTokenHex(OKX.tokens.USDC));
console.log('ZKS USDC: ', buildTokenHex(ZKSYNC.tokens.USDC));
console.log('ZKS WETH: ', buildTokenHex(ZKSYNC.tokens.WETH));