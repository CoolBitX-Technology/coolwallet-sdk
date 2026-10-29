import { tx, error, info, CardType } from '@coolwallet/core';
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

  if (await checkSupportsV5(transport)) {
    return signV5Transaction(signTxData, preparedData);
  }

  const { preActions, actions } = await scriptUtil.getScriptSigningActions(
    txVersion,
    transport,
    scriptType,
    appId,
    appPrivateKey,
    preparedData,
    output,
    change,
    signTxData.branchId
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

async function checkSupportsV5(transport: types.Transport): Promise<boolean> {
  const seVersion = await info.getSEVersion(transport);
  return seVersion >= params.ZEC_V5_MIN_SE_VERSION;
}

async function signV5Transaction(signTxData: types.signTxType, preparedData: types.PreparedData): Promise<string> {
  const { scriptType, transport, output, change, appId, appPrivateKey, branchId, expiryHeight } = signTxData;
  const { preActions, actions } = await scriptUtil.getV5ScriptSigningActions(
    transport,
    scriptType,
    appId,
    appPrivateKey,
    preparedData,
    output,
    change,
    branchId,
    expiryHeight
  );

  const signatures = await tx.flow.getSignaturesFromCoolWalletV2(
    transport,
    preActions,
    actions,
    SignatureType.DER,
    signTxData.confirmCB,
    signTxData.authorizedCB
  );
  const transaction = txUtil.composeFinalV5Transaction(preparedData, signatures as Buffer[], branchId, expiryHeight);
  return transaction.toString('hex');
}
