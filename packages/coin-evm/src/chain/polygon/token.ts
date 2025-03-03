export const TOKENS = {
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    unit: '6',
    contractAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    signature: `060455534454000000c2132d05d31c914a87c6611c10748aeb04b58e8f3045022100FDD2F1A2261F545063E8A5A07D96C6584B870DF184F7F0B2057B1AC98E3246150220061F92EB8AAC6BD120659A2D3E0184456135998F0B68224CBE9E752BA2BEAD85`,
  },
  'USDC.e': {
    name: 'Bridged USD Coin',
    symbol: 'USDC.e',
    unit: '6',
    contractAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    signature: `0606555344432e65002791bca1f2de4661ed88a30c99a7a9449aa8417430440220585A5962C104007B6CF679D164994DBF304A9B56F30E010C2779958235C34CC802204FB9A7957D1A5A647693B42D1ECFB66783E0F38C02C847C50D0F02307AEBC7FD`,
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    unit: '6',
    contractAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    signature: `0604555344430000003c499c542cef5e3811e1192ce70d8cc03d5c33593045022100F79B102A7297EE6CCADD20DCE1CA83564811B2058B1B6E0B11D4D9ABCFF2FAC2022061BA150B352A3E15E9759905E5FDA8523F4BF1BD586708D490D0A346D2B8F19A`,
  },
  BUSD: {
    name: 'binance-usd',
    symbol: 'BUSD',
    unit: '18',
    contractAddress: '0xdab529f40e671a1d4bf91361c21bf9f0c9712ab7',
    signature: `120442555344000000dab529f40e671a1d4bf91361c21bf9f0c9712ab7304402205AA7F3DE572DDFDEE0CD5296D0008749C3F0EC956A9C1EA15AC9B865AD6C0FAB02205B049B3D24D586086F42397E97C15B41363791F05E29B01C011C8BD54A439A8C`,
  },
  DAI: {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    unit: '18',
    contractAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    signature: `1203444149000000008f3cf7ad23cd3cadbd9735aff958023239c6a0633046022100890B702278F97AA34F8EA6ECA2F36A754B4DA5F804F58506B929E9B82152C993022100CF8E08D394CAD84193DAF2993AFDB220068D29D962F1399DFFE16D6F2AACE77E`,
  },
  WBTC: {
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    unit: '8',
    contractAddress: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
    signature: `0804574254430000001bfd67037b42cf73acf2047067bd4f2c47d9bfd6304502204FDACF27D1F85F0CD868C1DD71576AB064D76C3E4C91A71C2CE3C8A20B3E07B9022100A1ADBE88FC285F6AC9B35520A2FB71FC39A8420CBBEED039E903B12D856954BF`,
  },
  AVAX: {
    name: 'Avalanche Token',
    symbol: 'AVAX',
    unit: '18',
    contractAddress: '0x2c89bbc92bd86f8075d1decc58c7f4e0107f286b',
    signature: `1204415641580000002c89bbc92bd86f8075d1decc58c7f4e0107f286b304502202A79900887E87ED9FCAE5D8B888A39A0F37318234E926C4526638DD29DFE8C05022100DEC13ABF3CAE4727711D6041BC8246FC325B5077E22C6D78BACDC08FA12528B9`,
  },
  LINK: {
    name: 'ChainLink Token',
    symbol: 'LINK',
    unit: '18',
    contractAddress: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39',
    signature: `12044c494e4b00000053e0bca35ec356bd5dddfebbd1fc0fd03fabad3930450220298EDC2D2CE658A746C54D54166161F988B53B810ACF3E7F67B4694A696515F7022100955A98E796BBA6FAFE37A4AFB76A550A2DDB597D434CC7DD4441A4F11285BC93`,
  },
  UNI: {
    name: 'Uniswap',
    symbol: 'UNI',
    unit: '18',
    contractAddress: '0xb33eaad8d922b1083446dc23f610c2567fb5180f',
    signature: `1203554e4900000000b33eaad8d922b1083446dc23f610c2567fb5180f3045022100994A26D883D4E2731591E19878CCEDF4F5A42A450D35338AD6139147C90D347202200979A5D2D6F64111F6E1C329CEAA13E96C0009D655B4404E99C5C4B9EE65430B`,
  },
  WETH: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    unit: '18',
    contractAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    signature: '',
  },
  BNB: {
    name: 'BNB',
    symbol: 'BNB',
    unit: '18',
    contractAddress: '0x3BA4c387f786bFEE076A58914F5Bd38d668B42c3',
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
  ORDER: {
    name: 'Orderly Network',
    symbol: 'ORDER',
    unit: '18',
    contractAddress: '0x4e200fe2f3efb977d5fd9c430a41531fb04d97b8',
    signature: `12054f5244455200004e200fe2f3efb977d5fd9c430a41531fb04d97b83046022100CE9691A0307B991B2E0364D3D77EDA3633E28B16B2D3E42C5B938B9103B0948F022100C40F1A21755629C06763DA8A344B8C5395F32B2A272E91450FDD38CB37FBAD30`,
  },
  AAVE: {
    name: 'Aave Token',
    symbol: 'AAVE',
    unit: '18',
    contractAddress: '0xd6df932a45c0f255f85145f286ea0b292b21c90b',
    signature: `120441415645000000D6DF932A45C0F255F85145F286EA0B292B21C90B30450220331FF4095457825A96BBDEF0C497A01373B64C54438B87FE94417FECA18EC526022100BD041ACE2E780A90B67F127AB0AE1C8B7BABF2E2BDFE1610800BC9AB2281A171`,
  },
};
