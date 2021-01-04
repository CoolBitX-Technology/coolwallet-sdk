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
): Promise<{ r: string; s: string; } | Buffer> => {
  const {
    transport, appPrivateKey, appId, confirmCB, authorizedCB
  } = signTxData;

  const preActions = [];
  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  };

  preActions.push(sendScript);

  const action = async () => apdu.tx.executeScript(
    transport,
    appId,
    appPrivateKey,
    argument
  );

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  return canonicalSignature;
};
