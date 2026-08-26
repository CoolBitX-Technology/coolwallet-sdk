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

// Batch mode: `npm run list:token -- BSC:TWT:18:0x4B0F...` prints only the requested tokens, so a
// token that isn't in this package's chain modules yet (a brand new one being signed for the first
// time) can still get its hex from this script instead of a second copy of buildTokenHex elsewhere.
// With no arguments the hardcoded list below runs unchanged.
const specs = process.argv.slice(2);
if (specs.length > 0) {
  for (const spec of specs) {
    const [chain, symbol, unit, contractAddress] = spec.split(':');
    if (!chain || !symbol || !unit || !contractAddress) {
      throw new Error(`Expected a "<chain>:<symbol>:<unit>:<contractAddress>" spec, got "${spec}"`);
    }
    // Every field below is fixed-width, and an out-of-range value silently shifts the fields after it
    // while still producing a hex that looks signable — so each one is rejected before it can reach a
    // Signing Card. unit is 1 byte; symbol is 7 bytes preceded by a 1-byte length.
    if (!/^\d+$/.test(unit) || Number(unit) > 255) {
      throw new Error(`Expected a unit between 0 and 255 in "${spec}", got "${unit}"`);
    }
    // Printable ASCII only: the length byte counts UTF-16 units while the payload is UTF-8 bytes, so
    // a non-ASCII symbol (the hardcoded `USD₮0` below is one) makes the two disagree. Such a token has
    // to go through the manual flow.
    if (!/^[\x20-\x7e]{1,7}$/.test(symbol)) {
      throw new Error(`Expected a printable-ASCII symbol of at most 7 bytes in "${spec}", got "${symbol}"`);
    }
    if (!/^(0x)?[0-9a-fA-F]{40}$/.test(contractAddress)) {
      throw new Error(`Expected a 20-byte contract address in "${spec}", got "${contractAddress}"`);
    }
    console.log(`${chain} ${symbol}: `, buildTokenHex({ symbol, unit, contractAddress }));
  }
  process.exit(0);
}

console.log('ARB USD₮0: ', buildTokenHex(ARBITRUM.tokens['USDT0']));
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
console.log('ZKS USDC.e: ', buildTokenHex(ZKSYNC.tokens['USDC.e']));
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
