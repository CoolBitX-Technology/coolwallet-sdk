import { tx } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
import * as types from './config/types';
import { SignatureType } from '@coolwallet/core/lib/transaction/type';

/**
 * Sign ICON Transaction
 */
export default async function signTransaction(
  signTxData: types.signTxType,
  publicKey: string
): Promise<Record<string, any>> {
  const { transaction, transport, addressIndex, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const { script, argument } = await scriptUtil.getScriptAndArguments(addressIndex, transaction);

  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const sendArgument = async () => {
    return tx.command.executeScript(transport, appId, appPrivateKey, argument);
  };

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    sendArgument,
    SignatureType.Canonical,
    confirmCB,
    authorizedCB
  );
  const txObject = await txUtil.generateRawTx(canonicalSignature, transaction, publicKey);
  return txObject;
}
