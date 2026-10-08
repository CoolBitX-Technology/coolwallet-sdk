import { Transport } from '../../index';
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

/**
 * P1 of SIGN_DATA (INS 0xA0) on Go signing-only firmware.
 */
export enum SignCurve {
  SECP256K1 = '01',
  ED25519 = '02',
  BIP32ED25519 = '03',
  SCHNORR = '05',
}

export type SignDataParams<C extends SignCurve = SignCurve> = {
  transport: Transport;
  appId: string;
  appPrivateKey: string;
  /** SDK hex path: [pathType 1B][index 4B]..., e.g. the output of utils.getFullPath */
  path: string;
  curve: C;
  /** hex; 32-byte digest for SECP256K1 / SCHNORR, raw message for ED25519 / BIP32ED25519 */
  data: string;
};

export type EcdsaSignature = {
  curve: SignCurve.SECP256K1;
  /** strict DER, low-S */
  der: string;
  /** 32-byte hex */
  r: string;
  /** 32-byte hex, low-S */
  s: string;
};

export type EddsaSignature = {
  curve: SignCurve.ED25519 | SignCurve.BIP32ED25519;
  /** 64-byte hex */
  signature: string;
};

export type SchnorrSignature = {
  curve: SignCurve.SCHNORR;
  /** 64-byte hex */
  signature: string;
};

export type SignDataResult<C extends SignCurve = SignCurve> = C extends SignCurve.SECP256K1
  ? EcdsaSignature
  : C extends SignCurve.SCHNORR
  ? SchnorrSignature
  : EddsaSignature;
