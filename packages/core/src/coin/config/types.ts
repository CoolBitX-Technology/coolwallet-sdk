import { Transport } from '@coolwallet/core';
import { PathType } from '../../config';
import { SignatureType } from '../../transaction';

export { Transport };

export type SignTxData = {
  transport: Transport;
  coinType: string;
  addressIndex: number;
  depth?: number;
  pathType?: PathType;
  appPrivateKey: string;
  appId: string;
  message: string;
  signatureType: SignatureType;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type SignTxResult = CanonicalSignature | Buffer;

export type CanonicalSignature = {
  r: string;
  s: string;
};
