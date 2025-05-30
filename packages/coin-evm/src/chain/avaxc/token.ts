export const TOKENS = {
  // USDTe
  USDTe: {
    name: 'Tether USD',
    symbol: 'USDT.e',
    unit: '6',
    contractAddress: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118',
    signature: `0606555344542E6500c7198437980c041c805A1EDcbA50c1Ce5db9511830450220639368AAACCCCCDFD676FE83083FA438B148192EBDF88D65A49EC1742B90D213022100F477FA42F09014AC841D6E23687F85BF3B6B284D1E9A3BB9224EBBB30F88D4F1`,
  },
  // USDT
  USDT: {
    name: 'Tether Token',
    symbol: 'USDT',
    unit: '6',
    contractAddress: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    signature: `0604555344540000009702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7304502203DAB029429A7D5048A859A5C75075A1BDB47483C6E5FEE28E1D2B4EC3475A4D9022100FE735F167C66F0E0D9817F2C8CD328245F2D04F1B6654F47AE9A64EC592F3FB3`,
  },
  // DAI
  DAI: {
    name: 'Dai Stablecoin',
    symbol: 'DAI.e',
    unit: '18',
    contractAddress: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
    signature: `12054441492e650000d586E7F844cEa2F87f50152665BCbc2C279D8d70304602210084F71AD6A3AFF0F7BF5035C95E9BFAF4F62D45BE813D60EEE0B2331F74EE2D73022100C01365FE862D555BF875BE446533B43B486C84E7A6F4365509ED8B7106C38F25`,
  },
  // LINK
  LINK: {
    name: 'Chainlink Token',
    symbol: 'LINK.e',
    unit: '18',
    contractAddress: '0x5947bb275c521040051d82396192181b413227a3',
    signature: `12064c494e4b2e65005947bb275c521040051d82396192181b413227a33045022100FDD072B38B4BB35A06C11B6873F8CA5E3B9A704418CE4E0CCA56C5E7A272A2CB02207618B5DD3492F2D2E5FDB7A4371A4FD3EA6099448CC9957A0F93B3C2436385A2`,
  },
  // TUSD
  TUSD: {
    name: 'TrueUSD',
    symbol: 'TUSD',
    unit: '18',
    contractAddress: '0x1c20e891bab6b1727d14da358fae2984ed9b59eb',
    signature: `1204545553440000001c20e891bab6b1727d14da358fae2984ed9b59eb304402207A90F6B8BE08185A7BD7A119BE67FDF98758BC416051DE8C8AD10B2090410F50022055CF5C9F062DE895D50FD9BA9EC5FAF5B99C9F8F4A240A32B958BF974797CC4B`,
  },
  // SUSHI
  SUSHI: {
    name: 'SushiToken',
    symbol: 'SUSHI',
    unit: '18',
    contractAddress: '0x39cf1bd5f15fb22ec3d9ff86b0727afc203427cc',
    signature: `12055355534849000039cf1bd5f15fb22ec3d9ff86b0727afc203427cc3045022100B5217573EED36145707FBBFA05B34A72CE518A511D945A8A1E5436C360E9AFAA02203568EA5D5B2C1EEF0038D4645EEAC470F9658E6FE3D17284E567CA633694E28C`,
  },
  // FRAX
  FRAX: {
    name: 'Frax',
    symbol: 'FRAX',
    unit: '18',
    contractAddress: '0xDC42728B0eA910349ed3c6e1c9Dc06b5FB591f98',
    signature: `120446524158000000DC42728B0eA910349ed3c6e1c9Dc06b5FB591f98304402202F1777176C5C955361CA6913FF9852B3D742B012822EFB18DC32563A92CD2FB4022022C6CCF9064537459C4529678A27E5E50FCE592E8AF18D995DDB8C0BA63D52B9`,
  },
  // USDC
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    unit: '6',
    contractAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    signature: `060455534443000000B97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E3046022100D9C471954CE34166BAD468C979D4D8036692D9C727A5572E5435CDFA25284EF3022100A24AECA03439C3D9B0C0E85D8FF03B969B3248BBA8A2C2C2B87526C2D757DEA9`,
  },
  EURC: {
    name: 'Euro Coin',
    symbol: 'EURC',
    unit: '6',
    contractAddress: '0xC891EB4cbdEFf6e073e859e987815Ed1505c2ACD',
    signature: `060445555243000000C891EB4cbdEFf6e073e859e987815Ed1505c2ACD304502201302190EAD95B1D48A7A6D73E345E83B2B3F1B9942E9ADCAA75758889EA0E0BA022100FB2389B5C47BACC17B1768247C3455520E0DF542FD45F00845F883B4B35060DB`,
  },
  ORDER: {
    name: 'Orderly Network',
    symbol: 'ORDER',
    unit: '18',
    contractAddress: '0x4e200fe2f3efb977d5fd9c430a41531fb04d97b8',
    signature: `12054f5244455200004e200fe2f3efb977d5fd9c430a41531fb04d97b83046022100CE9691A0307B991B2E0364D3D77EDA3633E28B16B2D3E42C5B938B9103B0948F022100C40F1A21755629C06763DA8A344B8C5395F32B2A272E91450FDD38CB37FBAD30`,
  },
};

export const TEST_TOKENS = {
  LINK: {
    name: 'ChainLink Token',
    symbol: 'LINK',
    unit: '18',
    contractAddress: '0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846',
    signature: '',
  },
};
