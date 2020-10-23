import { transport } from '@coolwallet/core';
export type Transport = transport.default;

export type signTxType = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  signatureBase: Buffer,
  transaction: object,
  accountIndex: number,
  protocol: protocol | undefined,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined,
}


export type protocol = 'BIP44' | 'SLIP0010';

export type versionByteNames = 'ed25519PublicKey' | 'ed25519SecretSeed' | 'preAuthTx' | 'sha256Hash';

// export const path = '328000002C8000009480000000'
export const path = '108000002C8000009480000000'
export const coinType = '94'

export enum COIN_SPECIES{
  XLM = 'XLM', KAU = 'KAU', KAG = 'KAG', 
}


