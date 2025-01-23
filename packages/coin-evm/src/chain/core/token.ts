// reference: https://docs.coredao.org/docs/Dev-Guide/core-bridge-resources#bridges-and-tokens
export const TOKENS = {
  stCORE: {
    name: 'Liquid staked CORE',
    symbol: 'stCORE',
    unit: '18',
    contractAddress: '0xb3a8f0f0da9ffc65318aa39e55079796093029ad',
    signature: ``, // TODO: Core Chain
  },
  WBNB: {
    name: 'Wrapped BNB',
    symbol: 'WBNB',
    unit: '18',
    contractAddress: '0xdfbc618d3c48e553cb197f42482a0795bef7fe28',
    signature: ``,
  },
  BTCB: {
    name: 'Bitcoin BEP2',
    symbol: 'BTCB',
    unit: '18',
    contractAddress: '0x7a6888c85edba8e38f6c7e0485212da602761c08',
    signature: ``,
  },
  WBTC: {
    name: 'WBTC',
    symbol: 'WBTC',
    unit: '8',
    contractAddress: '0x5832f53d147b3d6cd4578b9cbd62425c7ea9d0bd',
    signature: ``,
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    unit: '6',
    contractAddress: '0x900101d06a7426441ae63e9ab3b9b0f63be145f1',
    signature: ``,
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    unit: '6',
    contractAddress: '0xa4151b2b3e269645181dccf2d426ce75fcbdeca9',
    signature: ``,
  },
  WETH: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    unit: '18',
    contractAddress: '0xeab3ac417c4d6df6b143346a46fee1b847b50296',
    signature: ``,
  },
};
