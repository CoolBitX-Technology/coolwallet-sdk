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

const buildTokenHex = (symbol: string) => {
  const token = findTokenBySymbol(symbol);
  const unitHex = token.decimals.toString(16).padStart(2, '0');
  const symbolLengthHex = token.symbol.length.toString(16).padStart(2, '0');
  const symbolHex = Buffer.from(token.symbol).toString('hex').padEnd(14, '0');

  const addrBase58 = token.address;
  const addrHex = bs58.decode(addrBase58).toString('hex');

  return `${unitHex}${symbolLengthHex}${symbolHex}${addrHex}`;
};

console.log('SOL USDT:', buildTokenHex('USDT'));
console.log('SOL EURC:', buildTokenHex('EURC'));
