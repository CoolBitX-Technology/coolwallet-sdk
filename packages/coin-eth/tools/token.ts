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

const buildTokenHex = (symbol: string) => {
  const token = findTokenBySymbol(symbol);
  const unitHex = (+token.unit).toString(16).padStart(2, '0');
  const symbolLengthHex = token.symbol.length.toString(16).padStart(2, '0');
  const symbolHex = Buffer.from(token.symbol).toString('hex').padEnd(14, '0');
  const address = token.contractAddress.startsWith('0x') ? token.contractAddress.slice(2) : token.contractAddress;

  return `${unitHex}${symbolLengthHex}${symbolHex}${address}`;
};

console.log('ETH GALA: ', buildTokenHex('GALA'));
console.log('ETH EURC: ', buildTokenHex('EURC'));
console.log('ETH WCT: ', buildTokenHex('WCT'));
console.log('ETH ORDER: ', buildTokenHex('ORDER'));
console.log('ETH AAVE: ', buildTokenHex('AAVE'));
