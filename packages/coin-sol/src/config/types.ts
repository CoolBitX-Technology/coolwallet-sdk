import { Transport } from '@coolwallet/core';
// export type Transport;

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: object;
  protocol: PROTOCOL | undefined;
  confirmCB: Function | undefined;
  authorizedCB: Function | undefined;
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
