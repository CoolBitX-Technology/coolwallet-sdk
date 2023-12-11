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
  chipMasterChainCode: '2c46cb15df0237d86c216690ebdee5ceeb19396ac1cc69e1bf8295555cf34ef9',
  chipMasterPublicKey: `0411c1a05f74dd3d30f19e332f7257c6873f60309fcd33208c12da388e9b7e92ccd5384094fe43d26cabe532b81096d86b2c946f8b3cd1970f2644568a11cd55e3`,
};
