import { Transport } from '@coolwallet/core';
export { Transport };

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


export enum PROTOCOL {
  BIP44 = 'BIP44',
  SLIP0010 = 'SLIP0010',
}
