import * as rlp from 'rlp';
import * as txUtil from './txUtil';
import { sayHi } from '../apdu/control';

/**
 * @description Prepare RLP Data for CoolWallet
 * @param {String} keyId hex string
 * @param {Buffer|Array<Buffer>} rawData - signMessage: payload, signTransaction: rawPayload
 * @param {String} readType
 * @return {Buffer}
 */
export const prepareSEData = (keyId, rawData, readType) => {
  const inputIdBuffer = Buffer.from('00', 'hex');
  const signDataBuffer = Buffer.from('00', 'hex');
  const readTypeBuffer = Buffer.from(readType, 'hex');
  const keyIdBuffer = Buffer.from(keyId, 'hex');

  const data = [inputIdBuffer, signDataBuffer, readTypeBuffer, keyIdBuffer, rawData];
  const dataForSE = rlp.encode(data);
  return dataForSE;
};

/**
 * sign data with coolwallet via script command
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {string} script
 * @param {string} argument
 * @param {boolean} isEDDSA
 * @param {Function} txPrepareComplteCallback
 * @param {Function} authorizedCallback
 * @param {boolean} return_canonical
 */
export const sendScriptAndDataToCard = async (
  transport,
  appId,
  appPrivateKey,
  script,
  argument,
  isEDDSA = false,
  txPrepareComplteCallback = null,
  authorizedCallback = null,
  return_canonical = true
) => {
  const encryptedSignature = await txUtil.getEncryptedSignatureByScripts(
    transport,
    appId,
    appPrivateKey,
    script,
    argument,
    txPrepareComplteCallback
  );

  const signatureKey = await txUtil.getCWSEncryptionKey(transport, authorizedCallback);
  return txUtil.decryptSignatureFromSE(encryptedSignature, signatureKey, isEDDSA, return_canonical);
};

/**
 * sign data with coolwallets.
 * @param {Transport} transport
 * @param {String} appId
 * @param {String} appPrivateKey
 * @param {Buffer} data for SE (output of prepareSEData)
 * @param {String} P1 hex string
 * @param {String} P2 hex string
 * @param {Function} preAction
 * @param {Function} txPrepareComplteCallback
 * @param {Function} authorizedCallback
 * @param {Boolean} isTestnet blind signing for SE version 67
 * @param {Boolean} return_canonical
 * @return {Promise< {r: string, s: string} | string | Buffer }>}
 */
export const sendDataToCoolWallet = async (
  transport,
  appId,
  appPrivateKey,
  data,
  P1,
  P2,
  isEDDSA = false,
  preAction = null,
  txPrepareComplteCallback = null,
  authorizedCallback = null,
  return_canonical = true
) => {
  const hexForSE = data.toString('hex');

  await sayHi(transport, appId);

  if (typeof preAction === 'function') await preAction();

  const commandSignature = txUtil.signForCoolWallet(appPrivateKey, hexForSE, P1, P2);
  const encryptedSignature = await txUtil.getSingleEncryptedSignature(
    transport,
    hexForSE,
    P1,
    commandSignature,
    txPrepareComplteCallback
  );
  const signatureKey = await txUtil.getCWSEncryptionKey(transport, authorizedCallback);

  const signature = txUtil.decryptSignatureFromSE(
    encryptedSignature,
    signatureKey,
    isEDDSA,
    return_canonical
  );
  return signature;
};
