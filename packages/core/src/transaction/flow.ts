import * as rlp from 'rlp';
import * as txUtil from './util';
import Transport, { CardType } from '../transport';
// import * as tx from '../apdu/transaction';
// import * as apdu from '../apdu/index';
import * as error from '../error';
import { SignatureType } from './type';
import * as command from './command';
import * as mcu from '../mcu';

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
 * @param {Array<{Function}>} action
 * @param {SignatureType} signatureType
 * @param {Function} txPrepareCompleteCallback notify app to show the tx info
 * @param {Function} authorizedCallback notify app to close the tx info
 * @return {Promise<Array<{r: string, s: string} | Buffer >>}
 */
export const getSingleSignatureFromCoolWalletV2 = async (
  transport: Transport,
  preActions: Array<Function> | undefined = undefined,
  action: Function,
  signatureType: SignatureType,
  txPrepareCompleteCallback: Function | undefined = undefined,
  authorizedCallback: Function | undefined = undefined
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
  if (transport.cardType === CardType.Pro) {
    // finish prepare
    await command.finishPrepare(transport);

    // get tx detail
    const result = await command.getTxDetail(transport);
    if (!result) {
      throw new error.SDKError(getSingleSignatureFromCoolWalletV2.name, 'get tx detail statusCode fail!!');
    }

    //authorize tx
    const signatureKey = await command.getSignatureKey(transport);
    if (typeof authorizedCallback === 'function') {
      authorizedCallback();
    }

    // clear tx
    await command.clearTransaction(transport);
    await mcu.control.powerOff(transport);

    // decrpt signature
    const signature = txUtil.decryptSignatureFromSE(encryptedSignature, signatureKey, signatureType);
    return signature;
  } else if (transport.cardType === CardType.Go) {
    return txUtil.formatSignature(encryptedSignature, signatureType);
  } else {
    throw new error.SDKError(getSingleSignatureFromCoolWalletV2.name, 'Not suppotrd card type.');
  }
};

/**
 * @description Send Signing Function to CoolWallet
 * @param {Transport} transport
 * @param {Array<{Function}>} preActions
 * @param {Array<{Function}>} actions
 * @param {SignatureType} signatureType
 * @param {Function} txPrepareCompleteCallback notify app to show the tx info
 * @param {Function} authorizedCallback notify app to close the tx info
 * @return {Promise<Array<{r: string, s: string} | Buffer >>}
 */
export const getSignaturesFromCoolWalletV2 = async (
  transport: Transport,
  preActions: Array<Function> | undefined = undefined,
  actions: Array<Function>,
  signatureType: SignatureType,
  txPrepareCompleteCallback: Function | undefined = undefined,
  authorizedCallback: Function | undefined = undefined
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

  if (transport.cardType === CardType.Pro) {
    // finish prepare
    await command.finishPrepare(transport);

    // get tx detail
    if (!(await command.getTxDetail(transport))) {
      throw new error.SDKError(getSignaturesFromCoolWalletV2.name, 'get tx detail statusCode fail!!');
    }
    //authorize tx
    const signatureKey = await command.getSignatureKey(transport);
    if (typeof authorizedCallback === 'function') {
      authorizedCallback();
    }
    // clear tx
    await command.clearTransaction(transport);
    await mcu.control.powerOff(transport);
    // decrpt signature
    const signatures = encryptedSignatureArray.map((encryptedSignature) =>
      txUtil.decryptSignatureFromSE(encryptedSignature, signatureKey, signatureType)
    );
    return signatures;
  } else if (transport.cardType === CardType.Go) {
    // decrpt signature
    const signatures = encryptedSignatureArray.map((encryptedSignature) =>
      txUtil.formatSignature(encryptedSignature, signatureType)
    );
    return signatures;
  } else {
    throw new error.SDKError(
      getSingleSignatureFromCoolWalletV2.name,
      `Not suppotrd card type. cardType=${transport.cardType}`
    );
  }
};
