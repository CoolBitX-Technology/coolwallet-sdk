import { sign } from '../crypto/sign';
import { aes256CbcDecrypt } from '../crypto/encryptions';
import * as signatureTools from '../crypto/signature';
import COMMAND from '../config/command';
import * as apdu from '../apdu/index';

/**
 * get command signature for CoolWalletS
 * @param {String} appPrivateKey
 * @param {String} data hex string
 * @param {String} txDataType hex P1 string
 * @return {String} signature
 */
export const signForCoolWallet = (appPrivateKey, data, txDataType) => {
  const command = COMMAND.TX_PREPARE;
  const P2 = '00';
  const prefix = command.CLA + command.INS + txDataType + P2;
  const payload = prefix + data;
  const signatureBuffer = sign(Buffer.from(payload, 'hex'), appPrivateKey);
  return signatureBuffer.toString('hex');
};

/**
 * do TX_PREP and get encrypted signature.
 * @param {Transport} transport
 * @param {string} hexForSE
 * @param {string} txDataType P1
 * @param {string} signature
 * @param {Function} txPrepareCompleteCallback
 *
 */
export const getSingleEncryptedSignature = async (
  transport,
  hexForSE,
  txDataType,
  signature,
  txPrepareCompleteCallback = null
) => {
  let encryptedSignature;
  const sendData = hexForSE + signature;
  const patch = Math.ceil(sendData.length / 500);
  for (let i = 0; i < patch; i++) {
    const patchData = sendData.substr(i * 500, 500);
    const p2 = patch === 1 ? '00' : (i === patch - 1 ? '8' : '0') + (i + 1);
    // eslint-disable-next-line no-await-in-loop
    encryptedSignature = await apdu.tx.prepTx(transport, patchData, txDataType, p2);
  }
  await apdu.tx.finishPrepare(transport);

  if (typeof txPrepareCompleteCallback === 'function') txPrepareCompleteCallback();

  return encryptedSignature;
};

/**
 * Send signing data to CoolWalletS, wait for encrypted signatures.
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
 * get the key used to encrypt transaction signature by CWS
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
