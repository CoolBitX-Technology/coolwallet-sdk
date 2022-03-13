import { Transport } from '@coolwallet/core';
<<<<<<< HEAD
// export type Transport;
=======
export { Transport };
>>>>>>> 8fb4ea2082fbf601bdf42512a126c16509202759

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: object;
  protocol: PROTOCOL | undefined;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type versionByteNames = 'ed25519PublicKey' | 'ed25519SecretSeed' | 'preAuthTx' | 'sha256Hash';

export enum COIN_SPECIES {
  XLM = 'XLM',
  KAU = 'KAU',
  KAG = 'KAG',
}

export enum PROTOCOL {
  BIP44 = 'BIP44',
  SLIP0010 = 'SLIP0010',
}
