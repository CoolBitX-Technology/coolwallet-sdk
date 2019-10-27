import * as commonUtil from './commonUtils';
import * as Helper from '../helper';
const rlp = require('rlp');

/**
 * @description Prepare RLP Data for CoolWallet
 * @param {String} keyId hex string
 * @param {Buffer|Array<Buffer>} rawData - signMessage: payload, signTransaction: rawPayload
 * @param {String} readType
 * @return {Buffer}
 */
export const prepareSEData = (keyId, rawData, readType) => {
  let inputIdBuffer = Buffer.from('00', 'hex');
  let signDataBuffer = Buffer.from('00', 'hex');
  let readTypeBuffer = Buffer.from(readType, 'hex');
  let keyIdBuffer = Buffer.from(keyId, 'hex');

  let data = [inputIdBuffer, signDataBuffer, readTypeBuffer, keyIdBuffer, rawData];
  let dataForSE = rlp.encode(data);
  return dataForSE;
};

/**
 * @description Send Data to CoolWallet
 * @param {Buffer} data for SE (output of prepareSEData)
 * @param {String} P1 hex string
 * @param {String} P2 hex string
 * @param {Function} preAction
 * @param {Function} txPrepareComplteCallback
 * @param {Function} authorizedCallback
 * @param {Boolean} isTestnet blind signing for SE version 67
 * @param {Boolean} return_canonical
 * @return {Promise<{signature: {r: string, s: string} | string | Buffer, cancel:boolean}>}
 */
export const sendDataToCoolWallet = async (
  data,
  P1,
  P2,
  isEDDSA = false,
  preAction = null,
  txPrepareComplteCallback = null,
  authorizedCallback = null,
  isTestnet = false,
  return_canonical = true,
) => {
  try {
    let hexForSE = data.toString('hex');

    await commonUtil.sayHi();

    if (typeof preAction === 'function') await preAction();

    const commandSignature = await commonUtil.signForCoolWallet(hexForSE, P1, P2, isTestnet);
    const encryptedSignature = await commonUtil.getSingleEncryptedSignature(
      hexForSE,
      P1,
      commandSignature,
      txPrepareComplteCallback,
      isTestnet,
    );
    const signatureKey = await commonUtil.getCWSEncryptionKey(authorizedCallback);

    if (signatureKey === undefined) return { signature: {}, cancel: true };

    const signature = commonUtil.decryptSignatureFromSE(encryptedSignature, signatureKey, isEDDSA, return_canonical);
    return { signature, cancel: false };
  } catch (error) {
    Helper.Other.toSystemError(error, `sendDataToCoolWallet Error`, '30000', 'commonFlow.js', 'sendDataToCoolWallet');
  }
};
