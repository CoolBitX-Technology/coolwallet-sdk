import * as rlp from 'rlp';
import * as txUtil from './txUtil';
import Transport from "../transport";
import * as tx from '../apdu/transaction'
import * as apdu from "../apdu/index";
import { SDKError } from '../error/errorHandle';

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
  // signing
  if (preActions) {
    // eslint-disable-next-line no-await-in-loop
    for (const preAction of preActions) {
      await preAction();
    }
  }
  const encryptedSignature = await action();

  if (typeof txPrepareCompleteCallback === "function")
    txPrepareCompleteCallback();

  // finish prepare
  await tx.finishPrepare(transport);

  // get tx detail
  if (! await tx.getTxDetail(transport)) {
    throw new SDKError(getSingleSignatureFromCoolWallet.name, 'get tx detail statusCode fail!!');
  }
  //authorize tx
  const signatureKey = await tx.getSignatureKey(transport);
  if (typeof authorizedCallback === "function") {
    authorizedCallback();
  }
  // clear tx
  await tx.clearTransaction(transport);
  await apdu.control.powerOff(transport);
  // decrpt signature
  const signature = txUtil.decryptSignatureFromSE(
    encryptedSignature,
    signatureKey,
    isEDDSA,
    returnCanonical
  );
  return signature;
};

/**
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
  if (typeof txPrepareCompleteCallback === "function")
    txPrepareCompleteCallback();

  // finish prepare
  await tx.finishPrepare(transport);

  // get tx detail
  if (! await tx.getTxDetail(transport)) {
    throw new SDKError(getSignaturesFromCoolWallet.name, 'get tx detail statusCode fail!!');
  }
  //authorize tx
  const signatureKey = await tx.getSignatureKey(transport);
  if (typeof authorizedCallback === "function") {
    authorizedCallback();
  }
  // clear tx
  await tx.clearTransaction(transport);
  await apdu.control.powerOff(transport);
  // decrpt signature
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
