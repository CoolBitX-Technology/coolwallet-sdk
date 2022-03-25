/* eslint-disable max-len */
export const TRANSFER = {
  VLS: {
    script:
      'FA0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    signature:
      ''

  }
};

export const PATH_BIP44 = '42'
export const PATH_SLIP0010 = '10'
export const COIN_TYPE = '80564c58'
export const VERSION_BYTES = {
  ed25519PublicKey: 6 << 3, // G
  ed25519SecretSeed: 18 << 3, // S
  preAuthTx: 19 << 3, // T
  sha256Hash: 23 << 3 // X
};
