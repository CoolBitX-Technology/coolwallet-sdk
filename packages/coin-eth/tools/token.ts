import { TOKENTYPE as Tokens } from '../src/config/tokenType';

type BuildTokenHexInput = {
  symbol: string;
  unit: string; // decimals
  contractAddress: string;
};

const findTokenBySymbol = (symbol: string): BuildTokenHexInput => {
  const foundTokenInfo = Tokens.find((token) => token.symbol === symbol);
  if (!foundTokenInfo) {
    throw new Error(`Token with symbol ${symbol} not found`);
  }
  return foundTokenInfo;
};

const buildTokenHex = (token: BuildTokenHexInput) => {
  const unitHex = (+token.unit).toString(16).padStart(2, '0');
  const symbolLengthHex = token.symbol.length.toString(16).padStart(2, '0');
  const symbolHex = Buffer.from(token.symbol).toString('hex').padEnd(14, '0');
  const address = token.contractAddress.startsWith('0x') ? token.contractAddress.slice(2) : token.contractAddress;

  return `${unitHex}${symbolLengthHex}${symbolHex}${address}`;
};

// Batch mode: `npm run list:token -- ETH:GALA:8:0xd1d2...` prints only the requested tokens, so a
// token that isn't in src/config/tokenType.ts yet (a brand new one being signed for the first time)
// can still get its hex from this script instead of a second copy of buildTokenHex elsewhere.
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
    // a non-ASCII symbol makes the two disagree. Such a token has to go through the manual flow.
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

console.log('ETH GALA: ', buildTokenHex(findTokenBySymbol('GALA')));
console.log('ETH EURC: ', buildTokenHex(findTokenBySymbol('EURC')));
console.log('ETH WCT: ', buildTokenHex(findTokenBySymbol('WCT')));
console.log('ETH ORDER: ', buildTokenHex(findTokenBySymbol('ORDER')));
console.log('ETH AAVE: ', buildTokenHex(findTokenBySymbol('AAVE')));
console.log('ETH LBTC: ', buildTokenHex(findTokenBySymbol('LBTC')));
console.log('ETH XAUt: ', buildTokenHex(findTokenBySymbol('XAUt')));
console.log('ETH RLUSD: ', buildTokenHex(findTokenBySymbol('RLUSD')));
