import { apdu, error, tx } from '@coolwallet/core';
import * as ethUtil from './utils/ethUtils';
import * as scriptUtils from './utils/scriptUtils';
import { removeHex0x } from './utils/stringUtil';
import * as scripts from './config/params';
import { signMsg, signTyped, EIP712Schema, signTx } from './config/types';
import { handleHex } from './utils/stringUtil';

const Web3 = require('web3');
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, inlineRefs: false });
const typedDataUtils = require('eth-sig-util').TypedDataUtils;
const rlp = require('rlp');

/**
 * sign BSC Transaction
 * @param {Transport} transport
 * @param {string} appId
 * @param {String} appPrivateKey
 * @param {coinType} coinType
 * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
 * value:string, data:string} transaction
 * @param {Number} addressIndex
 * @param {String} publicKey
 * @param {Function} confirmCB
 * @param {Function} authorizedCB
 * @return {Promise<string>}
 */
export const signTransaction = async (
  signTxData: signTx,
  script: string,
  argument: string,
  publicKey: string | undefined = undefined
): Promise<string> => {
  const { transport, transaction } = signTxData;

  const rawPayload = ethUtil.getRawHex(transaction);

  const preActions = [];
  let action;
  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  };
  preActions.push(sendScript);

  action = async () => {
    return tx.command.executeScript(transport, signTxData.appId, signTxData.appPrivateKey, argument);
  };
  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    tx.SignatureType.Canonical,
    signTxData.confirmCB,
    signTxData.authorizedCB
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const { v, r, s } = await ethUtil.genEthSigFromSESig(canonicalSignature, rlp.encode(rawPayload), publicKey);
    const serializedTx = ethUtil.composeSignedTransacton(rawPayload, v, r, s);
    return serializedTx;
  } else {
    throw new error.SDKError(signTransaction.name, 'canonicalSignature type error');
  }
};

/**
 * sign ETH Smart Contract Transaction
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
export const signSmartContractTransaction = async (
  signTxData: signTx,
  script: string,
  argument: string,
  publicKey: string | undefined = undefined
): Promise<string> => {
  const { transport, transaction } = signTxData;

  const rawPayload = ethUtil.getRawHex(transaction);

  const preActions = [];

  preActions.push(() => tx.command.sendScript(transport, script));

  preActions.push(() => tx.command.executeScript(transport, signTxData.appId, signTxData.appPrivateKey, argument));

  const action = () =>
    tx.command.executeSegmentScript(
      transport,
      signTxData.appId,
      signTxData.appPrivateKey,
      handleHex(signTxData.transaction.data)
    );

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    tx.SignatureType.Canonical,
    signTxData.confirmCB,
    signTxData.authorizedCB
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const { v, r, s } = await ethUtil.genEthSigFromSESig(canonicalSignature, rlp.encode(rawPayload), publicKey);
    const serializedTx = ethUtil.composeSignedTransacton(rawPayload, v, r, s);
    return serializedTx;
  } else {
    throw new error.SDKError(signTransaction.name, 'canonicalSignature type error');
  }
};

/**
 * Sign Message.
 * @return {Promise<String>}
 */
export const signMessage = async (
  signMsgData: signMsg,
  script: string,
  argument: string,
  publicKey: string | undefined = undefined
) => {
  const { transport, message } = signMsgData;

  const preActions = [];

  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const action = async () => {
    return tx.command.executeScript(transport, signMsgData.appId, signMsgData.appPrivateKey, argument);
  };

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    tx.SignatureType.Canonical,
    signMsgData.confirmCB,
    signMsgData.authorizedCB
  );

  const msgHex = handleHex(Web3.utils.toHex(message));
  const msgBuf = Buffer.from(msgHex, 'hex');

  const _19Buf = Buffer.from('19', 'hex');
  const prefix = 'Ethereum Signed Message:';
  const lfBuf = Buffer.from('0A', 'hex');
  const len = msgBuf.length.toString();

  const prefixBuf = Buffer.from(prefix, 'ascii');
  const lenBuf = Buffer.from(len, 'ascii');
  const payload = Buffer.concat([_19Buf, prefixBuf, lfBuf, lenBuf, msgBuf]);

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
 * @return {Promise<String>}
 */
export const signTypedData = async (
  typedData: signTyped,
  script: string,
  publicKey: string | undefined = undefined
): Promise<string> => {
  if (!ajv.validate(EIP712Schema, typedData.typedData)) throw new error.SDKError(signTypedData.name, ajv.errorsText());

  const { transport } = typedData;

  const preActions = [];

  const sanitizedData = typedDataUtils.sanitizeData(typedData.typedData);

  const encodedData = typedDataUtils.encodeData(sanitizedData.primaryType, sanitizedData.message, sanitizedData.types);

  const domainSeparate = typedDataUtils.hashStruct('EIP712Domain', sanitizedData.domain, sanitizedData.types);

  const argument = await scriptUtils.getSignTypedDataArgument(
    domainSeparate.toString('hex'),
    encodedData.toString('hex'),
    typedData.addressIndex
  );

  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const action = async () => {
    return tx.command.executeScript(transport, typedData.appId, typedData.appPrivateKey, argument);
  };

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    tx.SignatureType.Canonical,
    typedData.confirmCB,
    typedData.authorizedCB
  );
  const prefix = Buffer.from('1901', 'hex');

  const dataBuf = Buffer.from(Web3.utils.sha3(encodedData).substr(2), 'hex');

  const payload = Buffer.concat([prefix, domainSeparate, dataBuf]);

  if (!Buffer.isBuffer(canonicalSignature)) {
    const { v, r, s } = await ethUtil.genEthSigFromSESig(canonicalSignature, payload, publicKey);
    const signature = `0x${r}${s}${v.toString(16)}`;

    return signature;
  } else {
    throw new error.SDKError(signTypedData.name, 'canonicalSignature type error');
  }
};
