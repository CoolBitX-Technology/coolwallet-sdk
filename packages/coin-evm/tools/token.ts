import { BASE, OKX, ZKSYNC, OPTIMISM, AVAXC, POLYGON, ARBITRUM, CORE } from '../src/chain';
import { TokenProps } from '../src/chain/types';

type BuildTokenHexInput = Pick<TokenProps, 'symbol' | 'unit' | 'contractAddress'>;
const buildTokenHex = (token: BuildTokenHexInput) => {
  const unitHex = (+token.unit).toString(16).padStart(2, '0');
  const symbolLengthHex = token.symbol.length.toString(16).padStart(2, '0');
  const symbolHex = Buffer.from(token.symbol).toString('hex').padEnd(14, '0');
  const address = token.contractAddress.startsWith('0x') ? token.contractAddress.slice(2) : token.contractAddress;

  return `${unitHex}${symbolLengthHex}${symbolHex}${address}`;
};

console.log('ARB USD₮0: ', buildTokenHex(ARBITRUM.tokens['USD₮0']));
console.log('ARB USDC.e: ', buildTokenHex(ARBITRUM.tokens['USDC.e']));
console.log('ARB DAI: ', buildTokenHex(ARBITRUM.tokens.DAI));
console.log('ARB WBTC: ', buildTokenHex(ARBITRUM.tokens.WBTC));
console.log('ARB LINK: ', buildTokenHex(ARBITRUM.tokens.LINK));
console.log('ARB UNI: ', buildTokenHex(ARBITRUM.tokens.UNI));
console.log('ARB USDC: ', buildTokenHex(ARBITRUM.tokens.USDC));
console.log('ARB ORDER: ', buildTokenHex(ARBITRUM.tokens.ORDER));
console.log('ARB AAVE: ', buildTokenHex(ARBITRUM.tokens.AAVE));

console.log('OKX USDT: ', buildTokenHex(OKX.tokens.USDT));
console.log('OKX USDC: ', buildTokenHex(OKX.tokens.USDC));

console.log('ZKS USDC: ', buildTokenHex(ZKSYNC.tokens.USDC));
console.log('ZKS WETH: ', buildTokenHex(ZKSYNC.tokens.WETH));

console.log('POL ORDER: ', buildTokenHex(POLYGON.tokens.ORDER));
console.log('POL USDT: ', buildTokenHex(POLYGON.tokens.USDT));
console.log('POL USDC.e: ', buildTokenHex(POLYGON.tokens['USDC.e']));
console.log('POL USDC: ', buildTokenHex(POLYGON.tokens.USDC));
console.log('POL BUSD: ', buildTokenHex(POLYGON.tokens.BUSD));
console.log('POL DAI: ', buildTokenHex(POLYGON.tokens.DAI));
console.log('POL WBTC: ', buildTokenHex(POLYGON.tokens.WBTC));
console.log('POL AVAX: ', buildTokenHex(POLYGON.tokens.AVAX));
console.log('POL LINK: ', buildTokenHex(POLYGON.tokens.LINK));
console.log('POL UNI: ', buildTokenHex(POLYGON.tokens.UNI));
console.log('POL WETH: ', buildTokenHex(POLYGON.tokens.WETH));
console.log('POL BNB: ', buildTokenHex(POLYGON.tokens.BNB));
console.log('POL CRO: ', buildTokenHex(POLYGON.tokens.CRO));
console.log('POL UST: ', buildTokenHex(POLYGON.tokens.UST));
console.log('POL AAVE: ', buildTokenHex(POLYGON.tokens.AAVE));

console.log('BASE WETH: ', buildTokenHex(BASE.tokens.WETH));
console.log('BASE USDbC: ', buildTokenHex(BASE.tokens.USDbC));
console.log('BASE axlUSDC: ', buildTokenHex(BASE.tokens.axlUSDC));
console.log('BASE BSWAP: ', buildTokenHex(BASE.tokens.BSWAP));
console.log('BASE ORDER: ', buildTokenHex(BASE.tokens.ORDER));
console.log('BASE AAVE: ', buildTokenHex(BASE.tokens.AAVE));

console.log('OP USDC.e: ', buildTokenHex(OPTIMISM.tokens['USDC.e']));
console.log('OP USDC: ', buildTokenHex(OPTIMISM.tokens.USDC));
console.log('OP WCT: ', buildTokenHex(OPTIMISM.tokens.WCT));
console.log('OP ORDER: ', buildTokenHex(OPTIMISM.tokens.ORDER));
console.log('OP USDT: ', buildTokenHex(OPTIMISM.tokens.USDT));
console.log('OP DAI: ', buildTokenHex(OPTIMISM.tokens.DAI));
console.log('OP WBTC: ', buildTokenHex(OPTIMISM.tokens.WBTC));
console.log('OP LINK: ', buildTokenHex(OPTIMISM.tokens.LINK));
console.log('OP OP: ', buildTokenHex(OPTIMISM.tokens.OP));
console.log('OP UNI: ', buildTokenHex(OPTIMISM.tokens.UNI));
console.log('OP WLD: ', buildTokenHex(OPTIMISM.tokens.WLD));
console.log('OP AAVE: ', buildTokenHex(OPTIMISM.tokens.AAVE));

console.log('AVAXC EURC: ', buildTokenHex(AVAXC.tokens.EURC));
console.log('AVAXC ORDER: ', buildTokenHex(AVAXC.tokens.ORDER));

console.log('CORE stCORE: ', buildTokenHex(CORE.tokens.stCORE));
console.log('CORE USDT: ', buildTokenHex(CORE.tokens.USDT));
console.log('CORE USDC: ', buildTokenHex(CORE.tokens.USDC));
