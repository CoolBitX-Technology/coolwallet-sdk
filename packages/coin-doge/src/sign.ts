import { tx, error } from '@coolwallet/core';
import { ScriptType } from './config/types';
import * as param from './config/param';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
import { signTxType } from './config/types';
import { SignatureType } from '@coolwallet/core/lib/transaction/type';
import { checkRedeemScriptType } from './utils/transactionUtil';

export async function signTransaction(signTxData: signTxType): Promise<string> {
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

  const { preparedData } = txUtil.createPreparedData(redeemScriptType, inputs, output, change, version);

  const script = param.TRANSFER.script + param.TRANSFER.signature;
  const argument = await scriptUtil.getArgument(output, change);

  const { preActions } = scriptUtil.getScriptSigningPreActions(transport, appId, appPrivateKey, script, argument);

  const { actions } = await scriptUtil.getScriptSigningActions(transport, appId, appPrivateKey, preparedData);

  let signatureType: SignatureType;

  switch (redeemScriptType) {
    case ScriptType.P2PKH:
      signatureType = SignatureType.DER;
      break;
    default:
      throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${redeemScriptType}'`);
  }

  const signatures = await tx.flow.getSignaturesFromCoolWalletV2(
    transport,
    preActions,
    actions,
    confirmCB,
    authorizedCB,
    signatureType
  );
  const transaction = txUtil.composeFinalTransaction(preparedData, signatures as Buffer[]);
  return transaction.toString('hex');
}
