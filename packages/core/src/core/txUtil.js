import { sign } from '../crypto/sign';
import { aes256CbcDecrypt } from '../crypto/encryptions';
import * as signatureTools from '../crypto/signature';
import COMMAND from '../config/command';
import * as apdu from '../apdu/index';

/**
 * Check if the current SE support script execution
 * @param {Transport} transport
 * @returns {Promise<boolean>}
 */
export const checkSupportScripts = async (transport) => {
  try {
    await apdu.tx.getSignedHex(transport);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * get command signature for CoolWalletS
 * @param {String} appPrivateKey
 * @param {String} data hex string
 * @param {String} P1 hex string
 * @param {String} P2 hex string
 * @return {String} signature
 */
export const signForCoolWallet = (appPrivateKey, data, P1, P2) => {
  const command = COMMAND.TX_PREPARE;
  const prefix = command.CLA + command.INS + P1 + P2;
  const payload = prefix + data;
  const signatureBuuffer = sign(Buffer.from(payload, 'hex'), appPrivateKey);
  return signatureBuuffer.toString('hex');
};

export const getEncryptedSignatureByScripts = async (
  transport,
  script,
  argument,
  txPrepareComplteCallback = null
) => {
  await apdu.tx.sendScript(transport, script);
  const encryptedSignature = await apdu.tx.executeScript(transport, argument);
  await apdu.tx.finishPrepare(transport);
  // const signedTx = await apdu.tx.getSignedHex(transport);
  if (typeof txPrepareComplteCallback === 'function') txPrepareComplteCallback();
  return encryptedSignature;
};

/**
 * do TX_PREP and get encrypted signature.
 * @param {Transport} transport
 * @param {string} hexForSE
 * @param {string} P1
 * @param {string} signature
 * @param {Function} txPrepareComplteCallback
 *
 */
export const getSingleEncryptedSignature = async (
  transport,
  hexForSE,
  P1,
  signature,
  txPrepareComplteCallback = null
) => {
  let encryptedSignature;
  const sendData = hexForSE + signature;
  const patch = Math.ceil(sendData.length / 500);
  for (let i = 0; i < patch; i++) {
    const patchData = sendData.substr(i * 500, 500);
    const p2 = patch === 1 ? '00' : (i === patch - 1 ? '8' : '0') + (i + 1);
    // eslint-disable-next-line no-await-in-loop
    encryptedSignature = await apdu.tx.prepTx(transport, patchData, P1, p2);
  }
  await apdu.tx.finishPrepare(transport);

  if (typeof txPrepareComplteCallback === 'function') txPrepareComplteCallback();

  return encryptedSignature;
};

/**
 * Same as getSingleEncryptedSignature, but used for UTXO based coins to get array of sigs.
 * @param {Transport} transport
 * @param {Array<{encodedData:String, P1:String, P2:String}>}
 * TxpPrepCommands Array of txPrepare command object
 * @returns {Promise<Array<{encryptedSignature:String, publicKey:String}>>}
 */
export const getEncryptedSignatures = async (transport, TxpPrepCommands) => {
  const sigArr = [];
  for (const command of TxpPrepCommands) {
    const {
      encodedData, P1, P2, publicKey
    } = command;
    // eslint-disable-next-line no-await-in-loop
    const encryptedSignature = await apdu.tx.prepTx(transport, encodedData, P1, P2);
    if (encryptedSignature !== '' && encryptedSignature !== null) {
      sigArr.push({ encryptedSignature, publicKey });
    }
  }
  await apdu.tx.finishPrepare(transport);
  return sigArr;
};

/**
 * get the key used to encrypt signatures
 * @param {Transport} transport
 * @param {Function} authorizedCallback
 * @returns {Promise<String>}
 */
export const getCWSEncryptionKey = async (transport, authorizedCallback) => {
  const success = await apdu.tx.getTxDetail(transport);
  if (!success) return undefined;

  if (typeof authorizedCallback === 'function') authorizedCallback();

  const signatureKey = await apdu.tx.getSignatureKey(transport);

  await apdu.tx.clearTransaction(transport);
  await apdu.control.powerOff(transport);
  return signatureKey;
};

/**
 * @description Decrypt Data from CoolWallet
 * @param {String} encryptedSignature
 * @param {String} signatureKey
 * @param {Boolean} isEDDSA
 * @param {Boolean} returnCanonical
 * @return {{r:string, s:string} | string } canonical signature or DER signature
 */
export const decryptSignatureFromSE = (
  encryptedSignature,
  signatureKey,
  isEDDSA = false,
  returnCanonical = true
) => {
  const iv = Buffer.alloc(16);
  iv.fill(0);
  const derSigBuff = aes256CbcDecrypt(iv, Buffer.from(signatureKey, 'hex'), encryptedSignature);

  if (isEDDSA) return derSigBuff;

  const sigObj = signatureTools.parseDERsignature(derSigBuff.toString('hex'));
  const canonicalSignature = signatureTools.getCanonicalSignature(sigObj);
  if (returnCanonical) return canonicalSignature;

  return signatureTools.convertToDER(canonicalSignature);
};

/**
 * @param {String} coinType
 * @param {String} Number
 */
export const addressIndexToKeyId = (coinType, addressIndex) => {
  const indexHex = addressIndex.toString(16).padStart(4, '0');
  const keyId = `${coinType}0000${indexHex}`;
  return keyId;
};
