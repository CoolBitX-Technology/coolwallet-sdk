import * as rlp from 'rlp';
import * as txUtil from './txUtil';
import Transport from '../transport';
import * as tx from '../apdu/transaction';
import * as apdu from '../apdu/index';
import { SDKError } from '../error/errorHandle';
import { SignatureType } from './type';

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
 * @description Send Signing Function to CoolWallet
 * @param {Transport} transport
 * @param {Array<{Function}>} preActions
 * @param {Array<{Function}>} actions
 * @param {Function} txPrepareCompleteCallback notify app to show the tx info
 * @param {Function} authorizedCallback notify app to close the tx info
 * @param {SignatureType} signatureType
 * @return {Promise<Array<{r: string, s: string} | Buffer >>}
 */
export const getSingleSignatureFromCoolWalletV2 = async (
  transport: Transport,
  preActions: Array<Function> | undefined = undefined,
  action: Function,
  txPrepareCompleteCallback: Function | undefined = undefined,
  authorizedCallback: Function | undefined = undefined,
  signatureType: SignatureType
) => {
  // signing
  if (preActions) {
    // eslint-disable-next-line no-await-in-loop
    for (const preAction of preActions) {
      await preAction();
    }
  }
  const encryptedSignature = await action();

  if (typeof txPrepareCompleteCallback === 'function') txPrepareCompleteCallback();

  // finish prepare
  await tx.finishPrepare(transport);

  // get tx detail
  if (!(await tx.getTxDetail(transport))) {
    throw new SDKError(getSingleSignatureFromCoolWalletV2.name, 'get tx detail statusCode fail!!');
  }
  //authorize tx
  const signatureKey = await tx.getSignatureKey(transport);
  if (typeof authorizedCallback === 'function') {
    authorizedCallback();
  }
  // clear tx
  await tx.clearTransaction(transport);
  await apdu.mcu.control.powerOff(transport);
  // decrpt signature
  const signature = txUtil.decryptSignatureFromSE(encryptedSignature, signatureKey, signatureType);
  return signature;
};

/**
 * @description Send Signing Function to CoolWallet
 * @param {Transport} transport
 * @param {Array<{Function}>} preActions
 * @param {Array<{Function}>} actions
 * @param {Function} txPrepareCompleteCallback notify app to show the tx info
 * @param {Function} authorizedCallback notify app to close the tx info
 * @param {SignatureType} signatureType
 * @return {Promise<Array<{r: string, s: string} | Buffer >>}
 */
export const getSignaturesFromCoolWalletV2 = async (
  transport: Transport,
  preActions: Array<Function> | undefined = undefined,
  actions: Array<Function>,
  txPrepareCompleteCallback: Function | undefined = undefined,
  authorizedCallback: Function | undefined = undefined,
  signatureType: SignatureType
) => {
  // signing
  if (preActions) {
    // eslint-disable-next-line no-await-in-loop
    for (const preAction of preActions) {
      await preAction();
    }
  }
  const encryptedSignatureArray = [];
  // eslint-disable-next-line no-await-in-loop
  for (const action of actions) {
    encryptedSignatureArray.push(await action());
  }
  if (typeof txPrepareCompleteCallback === 'function') txPrepareCompleteCallback();

  // finish prepare
  await tx.finishPrepare(transport);

  // get tx detail
  if (!(await tx.getTxDetail(transport))) {
    throw new SDKError(getSignaturesFromCoolWalletV2.name, 'get tx detail statusCode fail!!');
  }
  //authorize tx
  const signatureKey = await tx.getSignatureKey(transport);
  if (typeof authorizedCallback === 'function') {
    authorizedCallback();
  }
  // clear tx
  await tx.clearTransaction(transport);
  await apdu.mcu.control.powerOff(transport);
  // decrpt signature
  const signatures = encryptedSignatureArray.map((encryptedSignature) =>
    txUtil.decryptSignatureFromSE(encryptedSignature, signatureKey, signatureType)
  );
  return signatures;
};

/**
 * @deprecated Please use getSingleSignatureFromCoolWalletV2 instead
 * @description Send Signing Function to CoolWallet
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
export const getSingleSignatureFromCoolWallet = async (
  transport: Transport,
  preActions: Array<Function> | undefined = undefined,
  action: Function,
  isEDDSA = false,
  txPrepareCompleteCallback: Function | undefined = undefined,
  authorizedCallback: Function | undefined = undefined,
  returnCanonical: boolean = true
) => {
  const signatureType = isEDDSA ? SignatureType.EDDSA : SignatureType.DER;
  return getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    txPrepareCompleteCallback,
    authorizedCallback,
    signatureType
  );
};

/**
 * @deprecated Please use getSignaturesFromCoolWalletV2 instead
 * @description Send Signing Function to CoolWallet
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
export const getSignaturesFromCoolWallet = async (
  transport: Transport,
  preActions: Array<Function> | undefined = undefined,
  actions: Array<Function>,
  isEDDSA = false,
  txPrepareCompleteCallback: Function | undefined = undefined,
  authorizedCallback: Function | undefined = undefined,
  returnCanonical: boolean = true
) => {
  const signatureType = isEDDSA ? SignatureType.EDDSA : SignatureType.DER;
  return getSignaturesFromCoolWalletV2(
    transport,
    preActions,
    actions,
    txPrepareCompleteCallback,
    authorizedCallback,
    signatureType
  );
};
