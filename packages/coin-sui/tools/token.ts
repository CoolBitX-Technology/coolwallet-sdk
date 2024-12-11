import { TOKEN_INFO as Tokens } from '../src/config/tokenInfos';

type BuildTokenHexInput = {
  symbol: string;
  decimals: number; // decimals
  address: string;
};

const findTokenBySymbol = (symbol: string): BuildTokenHexInput => {
  const foundTokenInfo = Tokens.find((token) => token.symbol === symbol);
  if (!foundTokenInfo) {
    throw new Error(`Token with symbol ${symbol} not found`);
  }
  return foundTokenInfo;
};

const buildTokenHex = (symbol: string) => {
  const token = findTokenBySymbol(symbol);
  const unitHex = (+token.decimals).toString(16).padStart(2, '0');
  const symbolLengthHex = token.symbol.length.toString(16).padStart(2, '0');
  const symbolHex = Buffer.from(token.symbol).toString('hex').padEnd(14, '0');
  const address = token.address.startsWith('0x') ? token.address.slice(2) : token.address;

  return `${unitHex}${symbolLengthHex}${symbolHex}${address}`;
};

console.log('SUI USDC: ', buildTokenHex('USDC'));
console.log('SUI CETUS: ', buildTokenHex('CETUS'));
console.log('SUI DEEP: ', buildTokenHex('DEEP'));
console.log('SUI BLUB: ', buildTokenHex('BLUB'));
console.log('SUI FUD: ', buildTokenHex('FUD'));
