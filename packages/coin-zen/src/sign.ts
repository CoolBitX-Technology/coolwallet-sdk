import { tx, error } from '@coolwallet/core';
import { ScriptType } from './config/types';
import * as txUtil from './utils/transactionUtil';
import { getScriptSigningActions } from './utils/scriptUtil';
import * as types from './config/types';
import { SignatureType } from '@coolwallet/core/lib/transaction/type';

export async function signTransaction(signTxData: types.signTxType): Promise<string> {
  const { scriptType, transport, inputs, output, change, appPrivateKey, appId } = signTxData;
  const signatureType = SignatureType.DER;

  if (scriptType !== ScriptType.P2PKH && scriptType !== ScriptType.P2SH) {
    throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${scriptType}'`);
  }

  const { preparedData } = txUtil.createUnsignedTransactions(scriptType, inputs, output, change);
  const { preActions, actions } = await getScriptSigningActions(
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
    signatureType,
    signTxData.confirmCB,
    signTxData.authorizedCB
  );
  const transaction = txUtil.composeFinalTransaction(scriptType, preparedData, signatures as Buffer[]);
  return transaction.toString('hex');
}
