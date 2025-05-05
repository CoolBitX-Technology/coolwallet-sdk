import { aes256CbcDecrypt } from '../crypto/encryptions';
import * as signatureTools from '../crypto/signature';
import * as error from '../error';
import { SignatureType } from './type';

/**
 *
 * @param {String} signature
 * @param {String} signatureType
 * @returns {{r:string, s:string} | Buffer } Buffer or DER signature
 */
export const formatSignature = (signature: string, signatureType: SignatureType): { r: string; s: string } | Buffer => {
  const iv = Buffer.alloc(16);
  iv.fill(0);
  const sigBuff = Buffer.from(signature, 'hex');
  switch (signatureType) {
    case SignatureType.EDDSA:
    case SignatureType.Schnorr:
      return sigBuff;
    case SignatureType.Canonical: {
      const sigObj = signatureTools.parseDERsignature(sigBuff.toString('hex'));
      const canonicalSignature = signatureTools.getCanonicalSignature(sigObj);
      return canonicalSignature;
    }
    case SignatureType.DER: {
      const sigObj = signatureTools.parseDERsignature(sigBuff.toString('hex'));
      const canonicalSignature = signatureTools.getCanonicalSignature(sigObj);
      return signatureTools.convertToDER(canonicalSignature);
    }
    default:
      throw new error.SDKError(formatSignature.name, 'Not supported SignatureType: ' + SignatureType);
  }
};

/**
 * @description Decrypt Data from CoolWallet
 * @param {String} encryptedSignature
 * @param {String} signatureKey
 * @param {SignatureType} signatureType
 * @return {{r:string, s:string} | Buffer } Buffer or DER signature
 */
export const decryptSignatureFromSE = (
  encryptedSignature: string,
  signatureKey: string,
  signatureType: SignatureType
): { r: string; s: string; s32?: string } | Buffer => {
  const iv = Buffer.alloc(16);
  iv.fill(0);
  const sigBuff = aes256CbcDecrypt(iv, Buffer.from(signatureKey, 'hex'), encryptedSignature);
  return formatSignature(sigBuff.toString('hex'), signatureType);
};

/**
 * @param {String} coinType
 * @param {String} addressIndex
 */
export const addressIndexToKeyId = (coinType: string, addressIndex: number) => {
  const indexHex = addressIndex.toString(16).padStart(4, '0');
  const keyId = `${coinType}0000${indexHex}`;
  return keyId;
};
