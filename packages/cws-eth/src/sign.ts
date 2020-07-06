import { apdu, transport, error, tx, util } from '@coolwallet/core';
// import { TypedDataUtils as typedDataUtils } from 'eth-sig-util';
import { isHex, keccak256 } from './lib';
import * as ethUtil from './utils/ethUtils';
import { removeHex0x, handleHex } from './utils/stringUtil';

const ethSigUtil = require('eth-sig-util');
const typedDataUtils = ethSigUtil.TypedDataUtils
const rlp = require('rlp');
type Transport = transport.default;

/**
 * sign ETH Transaction
 * @param {Transport} transport
 * @param {string} appId
 * @param {String} appPrivateKey
 * @param {coinType} coinType
 * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
 * value:string, data:string, chainId: number}} transaction
 * @param {Number} addressIndex
 * @param {String} publicKey
 * @param {Function} confirmCB
 * @param {Function} authorizedCB
 * @return {Promise<string>}
 */
export const signTransaction = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  coinType: string,
  transaction: { nonce: string, gasPrice: string, gasLimit: string, to: string, value: string, data: string, chainId: number },
  addressIndex: number,
  publicKey: string | undefined = undefined,
  confirmCB: Function | undefined = undefined,
  authorizedCB: Function | undefined = undefined,
): Promise<string> => {
  const rawPayload = ethUtil.getRawHex(transaction);
  const useScript = await util.checkSupportScripts(transport);
  const txType = ethUtil.getTransactionType(transaction);
  let canonicalSignature;
  if (useScript) {
    const { script, argument } = ethUtil.getScriptAndArguments(txType, addressIndex, transaction);
    const preActions = [];
    const sendScript = async () => {
      await apdu.tx.sendScript(transport, script);
    }
    preActions.push(sendScript);

    const sendArgument = async () => {
      return apdu.tx.executeScript(
        transport,
        appId,
        appPrivateKey,
        argument
      );
    }

    canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
      transport,
      preActions,
      sendArgument,
      false,
      confirmCB,
      authorizedCB,
      true
    );
  } else {
    const keyId = tx.util.addressIndexToKeyId(coinType, addressIndex);
    const { readType } = ethUtil.getReadType(txType);
    const dataForSE = tx.flow.prepareSEData(keyId, rawPayload, readType);

    const preActions = [];
    const sayHi = async () => {
      await apdu.general.hi(transport, appId);
    }
    preActions.push(sayHi)

    const prepareTx = async () => {
      return apdu.tx.txPrep(transport, dataForSE, "00", appPrivateKey);
    }

    canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
      transport,
      preActions,
      prepareTx,
      false,
      confirmCB,
      authorizedCB,
      true
    );
  }

  if (!Buffer.isBuffer(canonicalSignature)) {
    const { v, r, s } = await ethUtil.genEthSigFromSESig(
      canonicalSignature,
      rlp.encode(rawPayload),
      publicKey
    );
    const serializedTx = ethUtil.composeSignedTransacton(rawPayload, v, r, s, transaction.chainId);
    return serializedTx;
  } else {
    throw new error.SDKError(signTransaction.name, 'canonicalSignature type error');
  }
};

/**
 * Sign Message.
 * @param {Transport} transport
 * @param {String} appId
 * @param {String} appPrivateKey
 * @param {String} message hex or utf-8
 * @param {Number} addressIndex
 * @param {String} publicKey
 * @param {Boolean} isHashRequired used by joyso
 * @param {Function} confirmCB
 * @param {Function} authorizedCB
 * @return {Promise<String>}
 */
export const signMessage = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  coinType: string,
  message: string,
  addressIndex: number,
  publicKey: string | undefined = undefined,
  isHashRequired: boolean = false,
  confirmCB: Function | undefined = undefined,
  authorizedCB: Function | undefined = undefined
) => {
  const keyId = tx.util.addressIndexToKeyId(coinType, addressIndex);

  const preActions = [];
  const sayHi = async () => {
    await apdu.general.hi(transport, appId);
  }
  preActions.push(sayHi);

  let msgBuf;
  if (isHex(message)) {
    msgBuf = Buffer.from(removeHex0x(message), 'hex');
  } else {
    msgBuf = Buffer.from(message, 'utf8');
  }

  if (isHashRequired) {
    const apduForParsignMessage = async (msgBuf: Buffer) => {
      let rawData = msgBuf.toString("hex");
      rawData = handleHex(rawData);
      return async () => {
        apdu.tx.txPrep(transport, rawData, '07', appPrivateKey);
      }
    }
    preActions.push(apduForParsignMessage)
    msgBuf = Buffer.from(keccak256(msgBuf), 'hex');
  }

  const len = msgBuf.length.toString();
  const prefix = Buffer.from(`\u0019Ethereum Signed Message:\n${len}`);
  const payload = Buffer.concat([prefix, msgBuf]);
  const dataForSE = tx.flow.prepareSEData(keyId, payload, 'F5');
  const prepareTx = async () => {
    return apdu.tx.txPrep(transport, dataForSE, "00", appPrivateKey);
  }

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    prepareTx,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const { v, r, s } = await ethUtil.genEthSigFromSESig(canonicalSignature, payload, publicKey);
    const signature = `0x${r}${s}${v.toString(16)}`;
    return signature;
  } else {
    throw new error.SDKError(signMessage.name, 'canonicalSignature type error');
  }
};

/**
 * @description Sign Typed Data
 * @param {Transport} transport
 * @param {String} appId
 * @param {String} appPrivateKey
 * @param {String} coinType
 * @param {Object} typedData
 * @param {number} addressIndex
 * @param {Stirng} publicKey
 * @param {Function?} confirmCB
 * @param {Function?} authorizedCB
 * @return {Promise<String>}
 */
export const signTypedData = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  coinType: string,
  typedData: object,
  addressIndex: number,
  publicKey: string | undefined = undefined,
  confirmCB: Function | undefined = undefined,
  authorizedCB: Function | undefined = undefined
): Promise<string> => {
  const keyId = tx.util.addressIndexToKeyId(coinType, addressIndex);

  const sanitizedData = typedDataUtils.sanitizeData(typedData);
  const encodedData = typedDataUtils.encodeData(
    sanitizedData.primaryType,
    sanitizedData.message,
    sanitizedData.types
  );

  const prefix = Buffer.from('1901', 'hex');
  const domainSeparate = typedDataUtils.hashStruct(
    'EIP712Domain',
    sanitizedData.domain,
    sanitizedData.types
  );
  const dataHash = Buffer.from(keccak256(encodedData).substr(2), 'hex');
  const payload = Buffer.concat([prefix, domainSeparate, dataHash]);
  const dataForSE = tx.flow.prepareSEData(keyId, payload, 'F3');

  const preActions = [];
  const sayHi = async () => {
    await apdu.general.hi(transport, appId);
  }
  preActions.push(sayHi)

  const prepareTx = async () => {
    return apdu.tx.txPrep(transport, dataForSE, "00", appPrivateKey);
  }

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    prepareTx,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const { v, r, s } = await ethUtil.genEthSigFromSESig(canonicalSignature, payload, publicKey);
    const signature = `0x${r}${s}${v.toString(16)}`;

    return signature;
  } else {
    throw new error.SDKError(signTypedData.name, 'canonicalSignature type error');
  }


};
