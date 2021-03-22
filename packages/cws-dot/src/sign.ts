import { apdu, transport, tx } from '@coolwallet/core';
import { sha256 } from './utils/cryptoUtil';
import * as types from './config/types';
import * as txUtil from './utils/transactionUtil';

type Transport = transport.default;

const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ec = new elliptic.ec("secp256k1");
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
  publicKey: string
): Promise<string> => {
  const {
    transport, appPrivateKey, appId, confirmCB, authorizedCB, transaction
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
  
  const signature = await txUtil.getCompleteSignature(transport, publicKey, canonicalSignature)

  return signature
};

