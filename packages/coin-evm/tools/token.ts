import { BASE, OKX, ZKSYNC, OPTIMISM, AVAXC } from '../src/chain';
import { TokenProps } from '../src/chain/types';

type BuildTokenHexInput = Pick<TokenProps, 'symbol' | 'unit' | 'contractAddress'>;
const buildTokenHex = (token: BuildTokenHexInput) => {
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
console.log('BASE WETH: ', buildTokenHex(BASE.tokens.WETH));
console.log('BASE USDbC: ', buildTokenHex(BASE.tokens.USDbC));
console.log('BASE axlUSDC: ', buildTokenHex(BASE.tokens.axlUSDC));
console.log('BASE BSWAP: ', buildTokenHex(BASE.tokens.BSWAP));

console.log('OP USDC.e: ', buildTokenHex(OPTIMISM.tokens['USDC.e']));
console.log('OP USDC: ', buildTokenHex(OPTIMISM.tokens.USDC));
console.log('OP WCT: ', buildTokenHex(OPTIMISM.tokens.WCT));
console.log('AVAXC EURC: ', buildTokenHex(AVAXC.tokens.EURC));
