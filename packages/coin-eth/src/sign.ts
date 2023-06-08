import Web3 from 'web3';
import * as rlp from 'rlp';
import { TypedDataUtils as typedDataUtils } from 'eth-sig-util';
import createKeccakHash from 'keccak';
import Ajv from 'ajv';
import { apdu, error, tx } from '@coolwallet/core';
import * as ethUtil from './utils/ethUtils';
import * as ethUtilEIP1559 from './utils/ethUtilsEIP1559';
import * as scriptUtils from './utils/scriptUtils';
import { handleHex } from './utils/stringUtil';
import { signMsg, signTyped, EIP712Schema, signTx, signEIP1559Tx } from './config/types';

const ajv = new Ajv({ allErrors: true, inlineRefs: false });

export const signEIP1559Transaction = async (
  signTxData: signEIP1559Tx,
  script: string,
  argument: string,
  publicKey: string | undefined = undefined
): Promise<string> => {
  const { transport, transaction } = signTxData;

  const rawPayload = ethUtilEIP1559.getRawHex(transaction);

  const preActions = [];
  const sendScript = () => apdu.tx.sendScript(transport, script);
  preActions.push(sendScript);

  const action = () => apdu.tx.executeScript(transport, signTxData.appId, signTxData.appPrivateKey, argument);

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    signTxData.confirmCB,
    signTxData.authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const { v, r, s } = await ethUtilEIP1559.genEthSigFromSESig(
      canonicalSignature,
      Buffer.from(rlp.encode(rawPayload)),
      publicKey
    );
    const serializedTx = ethUtilEIP1559.composeSignedTransacton(rawPayload, v, r, s);
    return serializedTx;
  } else {
    throw new error.SDKError(signEIP1559Transaction.name, 'canonicalSignature type error');
  }
};

export const signEIP1559SmartContractTransaction = async (
  signTxData: signEIP1559Tx,
  script: string,
  argument: string,
  publicKey: string | undefined = undefined
): Promise<string> => {
  const { transport, transaction } = signTxData;

  const rawPayload = ethUtilEIP1559.getRawHex(transaction);

  const preActions = [];

  preActions.push(() => apdu.tx.sendScript(transport, script));

  preActions.push(() => apdu.tx.executeScript(transport, signTxData.appId, signTxData.appPrivateKey, argument));

  const action = () =>
    apdu.tx.executeSegmentScript(
      transport,
      signTxData.appId,
      signTxData.appPrivateKey,
      handleHex(signTxData.transaction.data)
    );

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    signTxData.confirmCB,
    signTxData.authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const { v, r, s } = await ethUtilEIP1559.genEthSigFromSESig(
      canonicalSignature,
      Buffer.from(rlp.encode(rawPayload)),
      publicKey
    );
    return ethUtilEIP1559.composeSignedTransacton(rawPayload, v, r, s);
  } else {
    throw new error.SDKError(signEIP1559Transaction.name, 'canonicalSignature type error');
  }
};

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
  signTxData: signTx,
  script: string,
  argument: string,
  publicKey: string | undefined = undefined
): Promise<string> => {
  const { transport, transaction } = signTxData;

  const rawPayload = ethUtil.getRawHex(transaction);

  const preActions = [];
  const sendScript = () => apdu.tx.sendScript(transport, script);

  preActions.push(sendScript);

  const action = () => apdu.tx.executeScript(transport, signTxData.appId, signTxData.appPrivateKey, argument);

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    signTxData.confirmCB,
    signTxData.authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const { v, r, s } = await ethUtil.genEthSigFromSESig(
      canonicalSignature,
      Buffer.from(rlp.encode(rawPayload)),
      publicKey
    );
    return ethUtil.composeSignedTransacton(rawPayload, v, r, s, transaction.chainId);
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

  preActions.push(() => apdu.tx.sendScript(transport, script));

  preActions.push(() => apdu.tx.executeScript(transport, signTxData.appId, signTxData.appPrivateKey, argument));

  const action = () =>
    apdu.tx.executeSegmentScript(
      transport,
      signTxData.appId,
      signTxData.appPrivateKey,
      handleHex(signTxData.transaction.data)
    );

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    signTxData.confirmCB,
    signTxData.authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const { v, r, s } = await ethUtil.genEthSigFromSESig(
      canonicalSignature,
      Buffer.from(rlp.encode(rawPayload)),
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
    await apdu.tx.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const action = async () => {
    return apdu.tx.executeScript(transport, signMsgData.appId, signMsgData.appPrivateKey, argument);
  };

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    signMsgData.confirmCB,
    signMsgData.authorizedCB,
    true
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
    const signature = `0x${r.padStart(64, '0')}${s.padStart(64, '0')}${v.toString(16)}`;
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
  if (!ajv.validate(EIP712Schema, typedData.typedData)) {
    throw new error.SDKError(signTypedData.name, ajv.errorsText());
  }

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
    await apdu.tx.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const action = async () => {
    return apdu.tx.executeScript(transport, typedData.appId, typedData.appPrivateKey, argument);
  };

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    typedData.confirmCB,
    typedData.authorizedCB,
    true
  );

  const prefix = Buffer.from('1901', 'hex');

  const dataBuf = createKeccakHash('keccak256').update(encodedData).digest();

  const payload = Buffer.concat([prefix, domainSeparate, dataBuf]);

  if (!Buffer.isBuffer(canonicalSignature)) {
    const { v, r, s } = await ethUtil.genEthSigFromSESig(canonicalSignature, payload, publicKey);
    const signature = `0x${r.padStart(64, '0')}${s.padStart(64, '0')}${v.toString(16)}`;

    return signature;
  } else {
    throw new error.SDKError(signTypedData.name, 'canonicalSignature type error');
  }
};
