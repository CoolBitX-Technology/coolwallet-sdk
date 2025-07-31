import { tx, error, info } from '@coolwallet/core';
import { ScriptType, PreparedData, Callback } from './config/types';
import * as param from './config/param';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
import { signTxType, Transport } from './config/types';
import { SignatureType } from '@coolwallet/core/lib/transaction/type';
import { shouldUseLegacyUtxoScript } from './utils/versionUtil';

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

  const signatures = await tx.flow.getSignaturesFromCoolWalletV2(
    transport,
    preActions,
    actions,
    signatureType,
    confirmCB,
    authorizedCB
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
    version
  );
  const seVersion = await info.getSEVersion(transport);

  let script;
  let argument;

  if (shouldUseLegacyUtxoScript(transport.cardType, seVersion) || redeemScriptType === ScriptType.P2PKH) {
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
