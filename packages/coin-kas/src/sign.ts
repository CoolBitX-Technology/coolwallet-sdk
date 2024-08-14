import { tx } from '@coolwallet/core';
import { SignTransferTxType } from './config/type';
import { SignatureType } from '@coolwallet/core/lib/transaction';
import { Transaction } from './transaction';
import {
  validateDustThreshold,
  validateInputs,
  validateOutputs,
  validateAmountCanDisplayOnProCard,
  validateTransaction,
} from './utils/validate';
import * as param from './config/param';
import { getTransferArgumentBuffer } from './utils/hash';
import { getSigningActions, getSigningPreActions } from './utils/scriptUtil';

export default async function signTransferTransaction(
  signTxData: SignTransferTxType,
  changeAddress: string
): Promise<string> {
  const { transport, appId, appPrivateKey, txData: partialTxData, addressIndex, confirmCB, authorizedCB } = signTxData;
  const { inputs, outputs, dustSize, fee } = partialTxData;
  validateInputs(inputs);
  validateOutputs(outputs);
  validateAmountCanDisplayOnProCard(outputs[0].value, 8);
  validateDustThreshold(outputs[0].value, dustSize);

  const transaction = Transaction.fromTxData({ ...partialTxData, changeAddress });
  validateTransaction(transaction, fee);

  const script = param.TRANSFER.script + param.TRANSFER.signature;
  const argumentBuf = await getTransferArgumentBuffer(transaction, addressIndex);
  const inputArgument = argumentBuf.toString('hex');
  const { preActions } = getSigningPreActions(transport, appId, appPrivateKey, script, inputArgument);
  const { actions } = await getSigningActions(transport, appId, appPrivateKey, transaction, addressIndex);

  const signatures = (await tx.flow.getSignaturesFromCoolWalletV2(
    transport,
    preActions,
    actions,
    confirmCB,
    authorizedCB,
    SignatureType.Schnorr
  )) as Array<Buffer>;

  transaction.addSignatures(signatures);
  return transaction.getMessage();
}
