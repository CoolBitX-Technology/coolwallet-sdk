import * as rlp from 'rlp';
import * as txUtil from './txUtil';
import { sayHi } from '../apdu/control';
import Transport from "../transport";

/**
 * @description Prepare RLP Data for CoolWallet
 * @param {String} keyId hex string
 * @param {Buffer|Array<Buffer>} rawData - signMessage: payload, signTransaction: rawPayload
 * @param {String} readType
 * @return {String} Hex input data for 8032 txPrep
 */
export const prepareSEData = (keyId: string, rawData: Buffer | Array<Buffer>, readType: string): string => {
	const inputIdBuffer = Buffer.from('00', 'hex');
	const signDataBuffer = Buffer.from('00', 'hex');
	const readTypeBuffer = Buffer.from(readType, 'hex');
	const keyIdBuffer = Buffer.from(keyId, 'hex');

	const data = [inputIdBuffer, signDataBuffer, readTypeBuffer, keyIdBuffer, rawData];
	const dataForSE = rlp.encode(data);
	return dataForSE.toString('hex');
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
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  script: string,
  argument: string,
  isEDDSA: boolean = false,
  txPrepareComplteCallback: Function | undefined = undefined,
  authorizedCallback: Function | undefined = undefined,
  return_canonical: boolean = true
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
 * @param {String} txDataHex for SE (output of prepareSEData)
 * @param {String} txDataType hex string
 * @param {Boolean} isEDDSA
 * @param {Function} preAction
 * @param {Function} txPrepareCompleteCallback notify app to show the tx info
 * @param {Function} authorizedCallback notify app to close the tx info
 * @param {Boolean} returnCanonical
 * @return {Promise< {r: string, s: string} | Buffer >}
 */
export const sendDataToCoolWallet = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  txDataHex: string,
  txDataType: string,
  isEDDSA: boolean = false,
  preAction: Function | undefined = undefined,
  txPrepareCompleteCallback: Function | undefined = undefined,
  authorizedCallback: Function | undefined = undefined,
  returnCanonical: boolean = true
) => {
  await sayHi(transport, appId);

  if (typeof preAction === 'function') await preAction();

  const encryptedSignature = await txUtil.getSingleEncryptedSignature(
    transport,
    txDataHex,
    txDataType,
    appPrivateKey,
    txPrepareCompleteCallback
  );
  const signatureKey = await txUtil.getCWSEncryptionKey(transport, authorizedCallback);

  const signature = txUtil.decryptSignatureFromSE(
    encryptedSignature,
    signatureKey,
    isEDDSA,
    returnCanonical
  );
  return signature;
};

/**
 * @description Send Data Array to CoolWallet
 * @param {Transport} transport
 * @param {String} appId
 * @param {String} appPrivateKey
 * @param {Array<{Function}>} preActions
 * @param {Array<{Function}>} actions
 * @param {Boolean} isEDDSA
 * @param {Function} txPrepareCompleteCallback notify app to show the tx info
 * @param {Function} authorizedCallback notify app to close the tx info
 * @param {Boolean} returnCanonical
 * @return {Promise<Array<{r: string, s: string} | Buffer >>}
 */
export const sendBatchDataToCoolWallet = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  preActions: Array<Function>,
  actions: Array<Function>,
  isEDDSA = false,
  txPrepareCompleteCallback: Function | undefined = undefined,
  authorizedCallback: Function | undefined = undefined,
  returnCanonical: boolean = true
) => {
  await sayHi(transport, appId);

  const encryptedSignatureArray = await txUtil.getEncryptedSignatures(
    transport,
    preActions,
    actions,
    txPrepareCompleteCallback
  );
  const signatureKey = await txUtil.getCWSEncryptionKey(transport, authorizedCallback);

  const signatures = encryptedSignatureArray.map(
    (encryptedSignature) => txUtil.decryptSignatureFromSE(
      encryptedSignature,
      signatureKey,
      isEDDSA,
      returnCanonical
    )
  );
  return signatures;
};
