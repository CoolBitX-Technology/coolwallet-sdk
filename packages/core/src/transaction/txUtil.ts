import { aes256CbcDecrypt } from "../crypto/encryptions";
import * as signatureTools from "../crypto/signature";

/**
 * @description Decrypt Data from CoolWallet
 * @param {String} encryptedSignature
 * @param {String} signatureKey
 * @param {Boolean} isEDDSA
 * @param {Boolean} returnCanonical
 * @return {{r:string, s:string} | Buffer } canonical or DER signature
 */
export const decryptSignatureFromSE = (
  encryptedSignature: string,
  signatureKey: string,
  isEDDSA: boolean = false,
  returnCanonical: boolean = true
): { r: string; s: string; } | Buffer => {
  const iv = Buffer.alloc(16);
  iv.fill(0);
  const derSigBuff = aes256CbcDecrypt(
    iv,
    Buffer.from(signatureKey, "hex"),
    encryptedSignature
  );

  if (isEDDSA) return derSigBuff;

  const sigObj = signatureTools.parseDERsignature(derSigBuff.toString("hex"));
  const canonicalSignature = signatureTools.getCanonicalSignature(sigObj);
  if (returnCanonical) return canonicalSignature;

  return signatureTools.convertToDER(canonicalSignature);
};

/**
 * @param {String} coinType
 * @param {String} addressIndex
 */
export const addressIndexToKeyId = (
  coinType: string,
  addressIndex: number
) => {
  const indexHex = addressIndex.toString(16).padStart(4, "0");
  const keyId = `${coinType}0000${indexHex}`;
  return keyId;
};
