import { apdu, transport, error, tx, util } from '@coolwallet/core';
import * as trxUtil from './utils/trxUtils';
import * as scripts from "./config/scripts";

type Transport = transport.default;

/**
 * sign TRX Transaction
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
  signTxData: any,
  script: string,
  argument: string,
  publicKey: string | undefined = undefined,
): Promise<string> => {

  const { transport, transaction } = signTxData

  const rawPayload = trxUtil.getRawHex(transaction);

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
      trxUtil.getArgument(signTxData)
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
    const { v, r, s } = await trxUtil.genTrxSigFromSESig(
      canonicalSignature,
      rawPayload,
      publicKey
    );
    const serializedTx = trxUtil.composeSignedTransacton(signTxData, v, r, s);
    return serializedTx;
  } else {
    throw new error.SDKError(signTransaction.name, 'canonicalSignature type error');
  }
};
