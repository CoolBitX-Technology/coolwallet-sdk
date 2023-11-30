import { tx, error, apdu } from '@coolwallet/core';
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
  seVersion: number,
  confirmCB?: Callback,
  authorizedCB?: Callback
): Promise<string> {
  const { actions } = await scriptUtil.getScriptSigningActions(
    transport,
    redeemScriptType,
    appId,
    appPrivateKey,
    preparedData,
    seVersion
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

async function checkRedeemScriptType(redeemScriptType: ScriptType) {
  if (
    redeemScriptType !== ScriptType.P2PKH &&
    redeemScriptType !== ScriptType.P2WPKH &&
    redeemScriptType !== ScriptType.P2SH_P2WPKH &&
    redeemScriptType !== ScriptType.P2TR
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
    version,
    appId,
    appPrivateKey,
    confirmCB,
    authorizedCB,
  } = signTxData;

  checkRedeemScriptType(redeemScriptType);

  const { preparedData } = txUtil.createUnsignedTransactions(
    redeemScriptType,
    inputs,
    output,
    change,
    /*value=*/ null,
    /*omniType=*/ null,
    version
  );
  const seVersion = await apdu.general.getSEVersion(transport);

  let script;
  let argument;

  if (seVersion <= 331 || redeemScriptType === ScriptType.P2PKH) {
    script = param.TRANSFER.script + param.TRANSFER.signature;
    argument = await scriptUtil.getBTCArgument(redeemScriptType, inputs, output, change);
  } else if (redeemScriptType === ScriptType.P2TR) {
    script = param.WITNESS_1.script + param.WITNESS_1.signature;
    argument = await scriptUtil.getWitness1Argument(redeemScriptType, inputs, output, change);
  } else {
    script = param.WITNESS_0.script + param.WITNESS_0.signature;
    argument = await scriptUtil.getWitness0Argument(redeemScriptType, inputs, output, change);
  }

  const { preActions } = scriptUtil.getScriptSigningPreActions(transport, appId, appPrivateKey, script, argument);

  return signTransaction(
    transport,
    appId,
    appPrivateKey,
    preActions,
    redeemScriptType,
    preparedData,
    seVersion,
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
    version,
    appId,
    appPrivateKey,
    confirmCB,
    authorizedCB,
    value,
  } = signUSDTTxData;

  checkRedeemScriptType(redeemScriptType);

  const omniType = OmniType.USDT;

  const { preparedData } = txUtil.createUnsignedTransactions(
    redeemScriptType,
    inputs,
    output,
    change,
    value,
    omniType,
    version
  );
  const seVersion = await apdu.general.getSEVersion(transport);

  let script;
  let argument;

  if (seVersion > 331 && redeemScriptType !== ScriptType.P2PKH) {
    script = param.NEW_USDT.script + param.NEW_USDT.signature;
    argument = await scriptUtil.getUSDTNewArgument(redeemScriptType, inputs, output, value, change);
  } else {
    script = param.USDT.script + param.USDT.signature;
    argument = await scriptUtil.getUSDTArgument(redeemScriptType, inputs, output, value, change);
  }

  const { preActions } = scriptUtil.getScriptSigningPreActions(transport, appId, appPrivateKey, script, argument);

  return await signTransaction(
    transport,
    appId,
    appPrivateKey,
    preActions,
    redeemScriptType,
    preparedData,
    seVersion,
    confirmCB,
    authorizedCB
  );
}
