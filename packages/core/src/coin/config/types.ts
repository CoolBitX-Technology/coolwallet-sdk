import { Transport } from '@coolwallet/core';
import { PathType } from '../../config';
import { SignatureType } from '../../transaction';

export { Transport };

export type SignTxHashData = {
  transport: Transport;
  addressIndex: number;
  depth?: number;
  purpose?: number;
  pathType?: PathType;
  appPrivateKey: string;
  appId: string;
  txHash: string;
  signatureType?: SignatureType;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type SignTxHashResult = CanonicalSignature | Buffer;

export type CanonicalSignature = {
  r: string;
  s: string;
};
