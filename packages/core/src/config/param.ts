export enum target {
  SE = 'SE',
  MCU = 'MCU',
}

export enum PathType {
  BIP32 = '32',
  SLIP0010 = '10',
  BIP32EDDSA = '42',
  BIP32ED25519 = '17',
  CURVE25519 = '19',
  BIP340 = '34',
}

export const SE_KEY_PARAM = {
  Pro: {
    // SE < 338
    chipMasterChainCode: '2c46cb15df0237d86c216690ebdee5ceeb19396ac1cc69e1bf8295555cf34ef9',
    chipMasterPublicKey: `0411c1a05f74dd3d30f19e332f7257c6873f60309fcd33208c12da388e9b7e92ccd5384094fe43d26cabe532b81096d86b2c946f8b3cd1970f2644568a11cd55e3`,
    // SE >= 338
    chipTransMasterChainCode: '515f75207921359a2c547590f457dfd5e5f4ddf0d5f94eb7b4c397656a3a3061',
    chipTransMasterPublicKey: `046dd46f9b64a044b38fa057c02535e1647bb260cc409ea47eaaf1ece65657afc069428f822d9ecec82bea11ae6ff4e62d7977d7dacc4b9b1453f0f17843f258ee`,
  },
  Go: {
    chipMasterChainCode: 'a7ba184bfb2fc1a91b019d88bb9681b3230067871fcb3e1ca8d08a45ae2a3447',
    chipMasterPublicKey: `04867ec9384abb465824c9839aeb1e66f83c54f1d9fb05a54caa0a13c8ee6f751800ed3a386a8b08acfd20ed9548cb2b3867ad000a3ec5e452225bffb1bfd4b26e`,
  },
};
