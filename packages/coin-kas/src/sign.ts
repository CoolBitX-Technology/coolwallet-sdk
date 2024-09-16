import { tx } from '@coolwallet/core';
import { SignTxType } from './config/types';
import { SignatureType } from '@coolwallet/core/lib/transaction';
import { Transaction } from './transaction';
import {
  validateDustThreshold,
  validateInputs,
  validateOutput,
  validateChange,
  validateAmountCanDisplayOnProCard,
  validateTransaction,
} from './utils/validate';
import * as param from './config/param';
import { getTransferArgumentBuffer } from './utils/hash';
import { getSigningActions, getSigningPreActions } from './utils/scriptUtil';

export default async function signTransferTransaction(signTxData: SignTxType): Promise<string> {
  const { transport, appId, appPrivateKey, inputs, output, change, version = 0, confirmCB, authorizedCB } = signTxData;
  validateInputs(inputs);
  validateOutput(output, !!change);
  validateAmountCanDisplayOnProCard(output.value, 8);
  validateDustThreshold(output.value);
  if (change) validateChange(change);

  const transaction = Transaction.fromTxData({
    version,
    inputs,
    output,
    change,
  });
  validateTransaction(transaction);

  const script = param.TRANSFER.script + param.TRANSFER.signature;
  const argumentBuf = await getTransferArgumentBuffer(transaction);
  const inputArgument = argumentBuf.toString('hex');
  const { preActions } = getSigningPreActions(transport, appId, appPrivateKey, script, inputArgument);
  const { actions } = await getSigningActions(transport, appId, appPrivateKey, transaction);

  const signatures = (await tx.flow.getSignaturesFromCoolWalletV2(
    transport,
    preActions,
    actions,
    confirmCB,
    authorizedCB,
    SignatureType.Schnorr
  )) as Array<Buffer>;

  transaction.addSignatures(signatures);
  const message = transaction.getMessage();
  return Buffer.from(message, 'utf-8').toString('hex');
}
