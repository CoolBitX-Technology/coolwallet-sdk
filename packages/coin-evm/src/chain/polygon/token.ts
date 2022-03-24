import type { TokenProps } from '../types';

type TokenName = 'WETH' | 'USDT' | 'BNB' | 'USDC' | 'MATIC' | 'BUSD' | 'CRO' | 'UST' | 'LINK' | 'WBTC';

export const TOKENS: Record<TokenName, TokenProps> = {
  WETH: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    unit: '18',
    contractAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    signature: '',
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    unit: '6',
    contractAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    signature: '',
  },
  BNB: {
    name: 'BNB',
    symbol: 'BNB',
    unit: '18',
    contractAddress: '0x3BA4c387f786bFEE076A58914F5Bd38d668B42c3',
    signature: '',
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    unit: '6',
    contractAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    signature: '',
  },
  MATIC: {
    name: 'Matic Token',
    symbol: 'MATIC',
    unit: '18',
    contractAddress: '0x0000000000000000000000000000000000001010',
    signature: '',
  },
  BUSD: {
    name: 'binance-usd',
    symbol: 'BUSD',
    unit: '18',
    contractAddress: '0xdab529f40e671a1d4bf91361c21bf9f0c9712ab7',
    signature: '',
  },
  WBTC: {
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    unit: '8',
    contractAddress: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
    signature: '',
  },
  CRO: {
    name: 'Crypto.com Coin',
    symbol: 'CRO',
    unit: '8',
    contractAddress: '0xada58df0f643d959c2a47c9d4d4c1a4defe3f11c',
    signature: '',
  },
  UST: {
    name: 'Wrapped UST Token',
    symbol: 'UST',
    unit: '18',
    contractAddress: '0x692597b009d13c4049a947cab2239b7d6517875f',
    signature: '',
  },
  LINK: {
    name: 'ChainLink Token',
    symbol: 'LINK',
    unit: '18',
    contractAddress: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39',
    signature: '',
  },
};
