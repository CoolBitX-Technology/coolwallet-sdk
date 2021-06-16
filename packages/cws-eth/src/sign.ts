import { apdu, error, tx } from '@coolwallet/core';
import * as ethUtil from './utils/ethUtils';
import * as scriptUtils from './utils/scriptUtils';
import { removeHex0x } from './utils/stringUtil';
import * as scripts from "./config/params";
import { signMsg, signTyped, EIP712Schema, signTx } from './config/types'

const Web3 = require('web3');
const Ajv = require('ajv');
const ajv = new Ajv();
const typedDataUtils = require('eth-sig-util').TypedDataUtils;
const rlp = require('rlp');

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
  publicKey: string | undefined = undefined,
): Promise<string> => {

  const { transport, transaction } = signTxData

  const rawPayload = ethUtil.getRawHex(transaction);

  const preActions = [];
  let action;
  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  }
  preActions.push(sendScript);

  action = async () => {
    return apdu.tx.executeScript(
      transport,
      signTxData.appId,
      signTxData.appPrivateKey,
      argument
    );
  }
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
 * @return {Promise<String>}
 */
export const signMessage = async (
  signMsgData: signMsg,
  script: string,
  argument: string,
  publicKey: string | undefined = undefined
) => {

  const { transport, message } = signMsgData


  const preActions = [];

  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  }
  preActions.push(sendScript);

  const action = async () => {
    return apdu.tx.executeScript(
      transport,
      signMsgData.appId,
      signMsgData.appPrivateKey,
      argument
    );
  }

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    signMsgData.confirmCB,
    signMsgData.authorizedCB,
    true
  );

  const keccak256Msg = Web3.utils.keccak256(message)

  let msgBuf;
  if (Web3.utils.isHex(keccak256Msg)) {
    msgBuf = Buffer.from(removeHex0x(keccak256Msg), 'hex');
  } else {
    msgBuf = Buffer.from(keccak256Msg, 'utf8');
  }


  const _19Buf = Buffer.from("19", 'hex');
  const prefix = "Ethereum Signed Message:";
  const lfBuf = Buffer.from("0A", 'hex')
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
  publicKey: string | undefined = undefined,
): Promise<string> => {

  if (!ajv.validate(EIP712Schema, typedData.typedData))
    throw new error.SDKError(signTypedData.name, ajv.errorsText());

  const { transport } = typedData;

  const preActions = [];

  const sanitizedData = typedDataUtils.sanitizeData(typedData.typedData);

  const encodedData = typedDataUtils.encodeData(
    sanitizedData.primaryType,
    sanitizedData.message,
    sanitizedData.types
  );

  const domainSeparate = typedDataUtils.hashStruct(
    'EIP712Domain',
    sanitizedData.domain,
    sanitizedData.types
  );

  const argument = await scriptUtils.getSignTypedDataArgument(domainSeparate.toString('hex'), encodedData.toString('hex'), typedData.addressIndex);


  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  }
  preActions.push(sendScript);

  const action = async () => {
    return apdu.tx.executeScript(
      transport,
      typedData.appId,
      typedData.appPrivateKey,
      argument
    );  
  }

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
