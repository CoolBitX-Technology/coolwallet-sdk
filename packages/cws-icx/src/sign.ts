import { apdu, transport, error, tx, utils } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil'
import * as scriptUtil from './utils/scriptUtil'
import * as types from './config/types'
/**
 * Sign ICON Transaction
 */
// eslint-disable-next-line import/prefer-default-export
export default async function signTransaction(
  signTxData: types.signTxType,
  publicKey: string,
): Promise<Object> {

  const { transaction, transport, addressIndex, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData

  let canonicalSignature;
  const preActions = [];

  const { script, argument } = scriptUtil.getScriptAndArguments(addressIndex, transaction);

  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  }
  preActions.push(sendScript);

  const sendArgument = async () => {
    return await apdu.tx.executeScript(
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
  const txObject = await txUtil.generateRawTx(canonicalSignature, transaction, publicKey);
  return txObject;
};
