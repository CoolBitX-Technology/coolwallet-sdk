import { tx, error, info } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
import * as versionUtil from './utils/versionUtil';
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

  const seVersion = await info.getSEVersion(transport);
  versionUtil.assertGoSeVersionSupportsZecScript(transport.cardType, seVersion);
  if (versionUtil.shouldSignV5(transport.cardType, seVersion)) {
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

async function signV5Transaction(signTxData: types.signTxType, preparedData: types.PreparedData): Promise<string> {
  const { scriptType, transport, output, change, appId, appPrivateKey, branchId } = signTxData;
  const expiryHeight = signTxData.expiryHeight ?? 0;

  // ZIP-203: nExpiryHeight is below 500000000
  if (!Number.isInteger(expiryHeight) || expiryHeight < 0 || expiryHeight > 499999999) {
    throw new error.SDKError(
      signV5Transaction.name,
      `Invalid expiryHeight '${signTxData.expiryHeight}', must be an integer in [0, 499999999]`
    );
  }

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
