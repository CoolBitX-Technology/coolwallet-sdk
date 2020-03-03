import { core } from '@coolwallets/core';
import Web3 from 'web3';
import { TypedDataUtils as typedDataUtils } from 'eth-sig-util';
import * as ethUtil from './eth_utils';

const rlp = require('rlp');

const web3 = new Web3();

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
  transport,
  appId,
  appPrivateKey,
  coinType,
  transaction,
  addressIndex,
  publicKey,
  confirmCB = null,
  authorizedCB = null
) => {
  const keyId = core.util.addressIndexToKeyId(coinType, addressIndex);
  const rawPayload = ethUtil.getRawHex(transaction);
  const {
    P1, P2, readType, preAction
  } = await ethUtil.getReadTypeAndParmas(
    transport,
    transaction
  );
  const dataForSE = core.flow.prepareSEData(keyId, rawPayload, readType);
  const canonicalSignature = await core.flow.sendDataToCoolWallet(
    transport,
    appId,
    appPrivateKey,
    dataForSE,
    P1,
    P2,
    false,
    preAction,
    confirmCB,
    authorizedCB
  );

  const { v, r, s } = await ethUtil.genEthSigFromSESig(
    canonicalSignature,
    rlp.encode(rawPayload),
    publicKey
  );
  return ethUtil.composeSignedTransacton(rawPayload, v, r, s, transaction.chainId);
};

export const signTransactionNew = async (
  transport,
  appId,
  appPrivateKey,
  transaction,
  addressIndex,
  publicKey,
  confirmCB = null,
  authorizedCB = null,
) => {
  
  const rawPayload = ethUtil.getRawHex(transaction)
  
  const { script, argument } = await ethUtil.getScriptAndArguments(addressIndex, transaction)
  const { signature: canonicalSignature, cancel } = await core.flow.sendScriptAndDataToCard(
    transport,
    appId,
    appPrivateKey,
    script,
    argument,
    false,
    confirmCB,
    authorizedCB,
    true
  )
  if (cancel) throw 'User canceled.'

  const { v, r, s } = await ethUtil.genEthSigFromSESig(canonicalSignature, rlp.encode(rawPayload), publicKey)
  const serialized_tx = ethUtil.composeSignedTransacton(rawPayload, v, r, s, transaction.chainId)
  return serialized_tx
}

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
  transport,
  appId,
  appPrivateKey,
  coinType,
  message,
  addressIndex,
  publicKey,
  isHashRequired = false,
  confirmCB = null,
  authorizedCB = null
) => {
  const keyId = core.util.addressIndexToKeyId(coinType, addressIndex);

  let msgBuf;
  let preAction;

  if (web3.utils.isHex(message)) {
    msgBuf = Buffer.from(ethUtil.removeHex0x(message), 'hex');
  } else {
    msgBuf = Buffer.from(message, 'utf8');
  }

  if (isHashRequired) {
    preAction = ethUtil.apduForParsingMessage(transport, msgBuf, '07'); // send prehashed message to card
    msgBuf = Buffer.from(web3.utils.keccak256(msgBuf), 'hex');
  }

  const len = msgBuf.length.toString();
  const prefix = Buffer.from(`\u0019Ethereum Signed Message:\n${len}`);
  const payload = Buffer.concat([prefix, msgBuf]);

  const dataForSE = core.flow.prepareSEData(keyId, payload, 'F5');

  const canonicalSignature = await core.flow.sendDataToCoolWallet(
    transport,
    appId,
    appPrivateKey,
    dataForSE,
    '00',
    '00',
    false,
    preAction,
    confirmCB,
    authorizedCB
  );

  const { v, r, s } = await ethUtil.genEthSigFromSESig(canonicalSignature, payload, publicKey);
  const signature = `0x${r}${s}${v.toString(16)}`;
  return signature;
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
  transport,
  appId,
  appPrivateKey,
  coinType,
  typedData,
  addressIndex,
  publicKey,
  confirmCB = null,
  authorizedCB = null
) => {
  const keyId = core.util.addressIndexToKeyId(coinType, addressIndex);

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
  const dataHash = Buffer.from(web3.utils.sha3(encodedData).substr(2), 'hex');
  const payload = Buffer.concat([prefix, domainSeparate, dataHash]);
  const dataForSE = core.flow.prepareSEData(keyId, payload, 'F3');

  const canonicalSignature = await core.flow.sendDataToCoolWallet(
    transport,
    appId,
    appPrivateKey,
    dataForSE,
    '00',
    '00',
    false,
    null,
    confirmCB,
    authorizedCB
  );

  const { v, r, s } = await ethUtil.genEthSigFromSESig(canonicalSignature, payload, publicKey);
  const signature = `0x${r}${s}${v.toString(16)}`;

  return signature;
};
