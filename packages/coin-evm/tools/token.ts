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

console.log(
  'ETH GALA: ',
  buildTokenHex({
    symbol: 'GALA',
    unit: '8',
    contractAddress: '0xd1d2Eb1B1e90B638588728b4130137D262C87cae',
  })
);
console.log(
  'ETH EURC: ',
  buildTokenHex({
    symbol: 'EURC',
    unit: '6',
    contractAddress: '0x1abaea1f7c830bd89acc67ec4af516284b1bc33c',
  })
);
console.log(
  'ETH WCT: ',
  buildTokenHex({
    symbol: 'WCT',
    unit: '18',
    contractAddress: '0x61cc6aF18C351351148815c5F4813A16DEe7A7E4',
  })
);

console.log('OP USDC.e: ', buildTokenHex(OPTIMISM.tokens['USDC.e']));
console.log('OP USDC: ', buildTokenHex(OPTIMISM.tokens.USDC));
console.log('OP WCT: ', buildTokenHex(OPTIMISM.tokens.WCT));
console.log('AVAXC EURC: ', buildTokenHex(AVAXC.tokens.EURC));
