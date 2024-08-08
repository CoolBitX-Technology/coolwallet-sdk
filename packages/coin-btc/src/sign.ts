import { tx, error, info, CardType } from '@coolwallet/core';
import { ScriptType, OmniType, PreparedData, Callback } from './config/types';
import * as param from './config/param';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
import { signTxType, signUSDTTxType, Transport } from './config/types';
import { SignatureType } from '@coolwallet/core/lib/transaction/type';

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
  console.log('aaaaaaaa11');
  const { actions } = await scriptUtil.getScriptSigningActions(
    transport,
    redeemScriptType,
    appId,
    appPrivateKey,
    preparedData,
    seVersion
  );
  console.log('aaaaaaaa12');

  let signatureType: SignatureType;

  switch (redeemScriptType) {
    case ScriptType.P2PKH:
    case ScriptType.P2WPKH:
    case ScriptType.P2SH_P2WPKH:
      signatureType = SignatureType.DER;
      break;
    case ScriptType.P2TR:
      signatureType = SignatureType.Schnorr;
      break;
    default:
      throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${redeemScriptType}'`);
  }
  console.log(`aaaaaaaa13 redeemScriptType=${redeemScriptType}`);

  const signatures = await tx.flow.getSignaturesFromCoolWalletV2(
    transport,
    preActions,
    actions,
    signatureType,
    confirmCB,
    authorizedCB
  );
  console.log(`aaaaaaaa14`);

  const transaction = txUtil.composeFinalTransaction(redeemScriptType, preparedData, signatures as Buffer[]);
  console.log(`aaaaaaaa15`);

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
  console.log(`aaaaaaaa0`);

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

  console.log(`aaaaaaaa1`);

  checkRedeemScriptType(redeemScriptType);
  console.log(`aaaaaaaa2`);

  const { preparedData } = txUtil.createUnsignedTransactions(
    redeemScriptType,
    inputs,
    output,
    change,
    /*value=*/ null,
    /*omniType=*/ null,
    version
  );
  console.log(`aaaaaaaa3`);

  const seVersion = await info.getSEVersion(transport);

  console.log(`aaaaaaaa4`);

  let script;
  let argument;

  console.log(`aaaaaaaa5`);

  if ((transport.cardType === CardType.Pro && seVersion <= 331) || redeemScriptType === ScriptType.P2PKH) {
    console.log(`aaaaaaaa6`);
    script = param.TRANSFER.script + param.TRANSFER.signature;
    argument = await scriptUtil.getBTCArgument(redeemScriptType, inputs, output, change);
  } else if (redeemScriptType === ScriptType.P2TR) {
    console.log(`aaaaaaaa7`);
    script = param.WITNESS_1.script + param.WITNESS_1.signature;
    argument = await scriptUtil.getWitness1Argument(redeemScriptType, inputs, output, change);
  } else {
    console.log(`aaaaaaaa8`);
    script = param.WITNESS_0.script + param.WITNESS_0.signature;
    argument = await scriptUtil.getWitness0Argument(redeemScriptType, inputs, output, change);
  }

  console.log(`aaaaaaaa9`);
  const { preActions } = scriptUtil.getScriptSigningPreActions(transport, appId, appPrivateKey, script, argument);

  console.log(`aaaaaaaa10`);
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
  const seVersion = await info.getSEVersion(transport);

  let script;
  let argument;

  if (transport.cardType === CardType.Pro && seVersion > 331 && redeemScriptType !== ScriptType.P2PKH) {
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
