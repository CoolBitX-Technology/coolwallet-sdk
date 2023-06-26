import { tx, error } from '@coolwallet/core';
import { ScriptType, OmniType, PreparedData, Callback } from './config/types';
import * as param from './config/param';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
import { signTxType, signUSDTTxType, Transport } from './config/types';

async function signTransaction(
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  preActions: Array<Callback>,
  redeemScriptType: ScriptType,
  preparedData: PreparedData,
  confirmCB?: Callback,
  authorizedCB?: Callback
): Promise<string> {
  const { actions } = scriptUtil.getScriptSigningActions(
    transport,
    redeemScriptType,
    appId,
    appPrivateKey,
    preparedData
  );

  const signatures = await tx.flow.getSignaturesFromCoolWallet(
    transport,
    preActions,
    actions,
    false,
    confirmCB,
    authorizedCB,
    false
  );
  const transaction = txUtil.composeFinalTransaction(redeemScriptType, preparedData, signatures as Buffer[]);
  return transaction.toString('hex');
}

async function chsckRedeemScriptType(redeemScriptType: ScriptType) {
  if (
    redeemScriptType !== ScriptType.P2PKH &&
    redeemScriptType !== ScriptType.P2WPKH &&
    redeemScriptType !== ScriptType.P2SH_P2WPKH
  ) {
    throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${redeemScriptType}'`);
  }
}

export async function signBTCTransaction(signTxData: signTxType): Promise<string> {
  const {
    scriptType: redeemScriptType,
    transport,
    inputs,
    output,
    change,
    appId,
    appPrivateKey,
    confirmCB,
    authorizedCB,
  } = signTxData;

  chsckRedeemScriptType(redeemScriptType);

  const { preparedData } = txUtil.createUnsignedTransactions(redeemScriptType, inputs, output, change);

  const argument = await scriptUtil.getBTCArgument(redeemScriptType, inputs, output, change);

  const script = param.TRANSFER.script + param.TRANSFER.signature;

  const { preActions } = scriptUtil.getScriptSigningPreActions(transport, appId, appPrivateKey, script, argument);

  return await signTransaction(
    transport,
    appId,
    appPrivateKey,
    preActions,
    redeemScriptType,
    preparedData,
    confirmCB,
    authorizedCB
  );
}

export async function signUSDTransaction(signUSDTTxData: signUSDTTxType): Promise<string> {
  const {
    scriptType: redeemScriptType,
    transport,
    inputs,
    output,
    change,
    appId,
    appPrivateKey,
    confirmCB,
    authorizedCB,
    value,
  } = signUSDTTxData;

  chsckRedeemScriptType(redeemScriptType);

  const omniType = OmniType.USDT;

  const { preparedData } = txUtil.createUnsignedTransactions(redeemScriptType, inputs, output, change, value, omniType);

  const script = param.USDT.script + param.USDT.signature;
  const argument = await scriptUtil.getUSDTArgument(redeemScriptType, inputs, output, value, change);

  const { preActions } = scriptUtil.getScriptSigningPreActions(transport, appId, appPrivateKey, script, argument);

  return await signTransaction(
    transport,
    appId,
    appPrivateKey,
    preActions,
    redeemScriptType,
    preparedData,
    confirmCB,
    authorizedCB
  );
}
