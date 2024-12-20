import { tx, error } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
import * as types from './config/types';
import { SignatureType } from '@coolwallet/core/lib/transaction';

export async function signTransaction(signTxData: types.signTxType, coinType: string): Promise<string> {
  const { scriptType, transport, inputs, output, change, appId, appPrivateKey } = signTxData;

  if (
    scriptType !== types.ScriptType.P2PKH &&
    scriptType !== types.ScriptType.P2WPKH &&
    scriptType !== types.ScriptType.P2SH_P2WPKH // coolwallet app use this scriptType
  ) {
    throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${scriptType}'`);
  }
  const { preparedData } = txUtil.createUnsignedTransactions(scriptType, inputs, output, change);
  const { preActions, actions } = await scriptUtil.getScriptSigningActions(
    transport,
    scriptType,
    appId,
    appPrivateKey,
    inputs,
    preparedData,
    output,
    change,
    coinType
  );

  const signatures = await tx.flow.getSignaturesFromCoolWalletV2(
    transport,
    preActions,
    actions,
    SignatureType.DER,
    signTxData.confirmCB,
    signTxData.authorizedCB
  );
  const transaction = txUtil.composeFinalTransaction(scriptType, preparedData, signatures as Buffer[]);
  return transaction.toString('hex');
}
