import { TOKEN_INFO } from '../src/config/tokenInfos';
import bs58 from 'bs58';

type BuildTokenHexInput = {
  symbol: string;
  decimals: number;
  address: string;
};

const findTokenBySymbol = (symbol: string): BuildTokenHexInput => {
  const foundTokenInfo = TOKEN_INFO.find((token) => token.symbol === symbol);
  if (!foundTokenInfo) {
    throw new Error(`Token with symbol ${symbol} not found`);
  }
  return foundTokenInfo;
};

const buildTokenHex = (token: BuildTokenHexInput) => {
  const unitHex = token.decimals.toString(16).padStart(2, '0');
  const symbolLengthHex = token.symbol.length.toString(16).padStart(2, '0');
  const symbolHex = Buffer.from(token.symbol).toString('hex').padEnd(14, '0');

  const addrBase58 = token.address;
  const addressBytes = bs58.decode(addrBase58);
  // bs58 rejects a non-base58 string but not a valid one of the wrong length; a mint that isn't
  // 32 bytes would produce a hex the card can't hold, so it must not reach a Signing Card.
  if (addressBytes.length !== 32) {
    throw new Error(`Expected a 32-byte Solana address, got ${addressBytes.length} bytes for "${addrBase58}"`);
  }
  const addrHex = addressBytes.toString('hex');

  return `${unitHex}${symbolLengthHex}${symbolHex}${addrHex}`;
};

// Batch mode: `npm run list:token -- SOL:USDT:6:Es9vMFrz...` prints only the requested tokens, so a
// token that isn't in src/config/tokenInfos.ts yet (a brand new one being signed for the first time)
// can still get its hex from this script instead of a second copy of buildTokenHex elsewhere.
// The `decimals` and `address` fields are spelled `unit`/`contractAddress` in the spec so all three
// chains' scripts accept the same `<chain>:<symbol>:<unit>:<address>` argument.
// With no arguments the hardcoded list below runs unchanged.
const specs = process.argv.slice(2);
if (specs.length > 0) {
  for (const spec of specs) {
    const parts = spec.split(':');
    const [chain, symbol, unit, address] = parts;
    if (parts.length !== 4 || !chain || !symbol || !unit || !address) {
      throw new Error(`Expected a "<chain>:<symbol>:<unit>:<address>" spec, got "${spec}"`);
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
    console.log(`${chain} ${symbol}: `, buildTokenHex({ symbol, decimals: Number(unit), address }));
  }
  process.exit(0);
}

console.log('SOL USDT:', buildTokenHex(findTokenBySymbol('USDT')));
console.log('SOL EURC:', buildTokenHex(findTokenBySymbol('EURC')));
console.log('SOL ORDER:', buildTokenHex(findTokenBySymbol('ORDER')));
