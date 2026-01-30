import { tx, error } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
import * as types from './config/types';
import { SignatureType } from '@coolwallet/core/lib/transaction';
import * as params from './config/params';

export async function signTransaction(signTxData: types.signTxType): Promise<string> {
  const { scriptType, transport, inputs, output, change, appId, appPrivateKey } = signTxData;

  if (scriptType !== types.ScriptType.P2PKH) {
    throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${scriptType}'`);
  }

  const txVersion = params.txVersion.V4;
  const { preparedData } = txUtil.createUnsignedTransactions(scriptType, inputs, output, change);
  const { preActions, actions } = await scriptUtil.getScriptSigningActions(
    txVersion,
    transport,
    scriptType,
    appId,
    appPrivateKey,
    inputs,
    preparedData,
    output,
    change
  );

  const signatures = await tx.flow.getSignaturesFromCoolWalletV2(
    transport,
    preActions,
    actions,
    SignatureType.DER,
    signTxData.confirmCB,
    signTxData.authorizedCB
  );
  const transaction = txUtil.composeFinalTransaction(txVersion, scriptType, preparedData, signatures as Buffer[]);
  return transaction.toString('hex');
}
