import { apdu, transport, error, tx, util } from '@coolwallet/core';
// import { TypedDataUtils as typedDataUtils } from 'eth-sig-util';
import * as ethUtil from './utils/trxUtils';
import * as scripts from "./config/scripts";
import { signTx } from './config/type'

const Ajv = require('ajv');
const ajv = new Ajv();
const typedDataUtils = require('eth-sig-util').TypedDataUtils;
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

  const { signedTx } = await apdu.tx.getSignedHex(transport);

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
