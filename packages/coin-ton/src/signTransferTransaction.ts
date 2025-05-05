import { SignTransferTxType } from './config/types';
import * as param from './config/param';
import * as scriptUtil from './utils/scriptUtils';
import * as transactionUtil from './utils/transactionUtils';
import * as addressUtil from './utils/addressUtils';
import { tx } from '@coolwallet/core';
import { SignatureType } from '@coolwallet/core/lib/transaction';
import { checkTransferTransaction } from './utils/checkParams';
import { requireTransferTransaction } from './utils/requireParams';

export default async function signTransferTransaction(signTxData: SignTransferTxType): Promise<string> {
  const { transport, appId, appPrivateKey, addressIndex, transaction, confirmCB, authorizedCB } = signTxData;

  checkTransferTransaction(transaction);

  const requiredTransaction = requireTransferTransaction(transaction);

  const script = param.TRANSFER.script + param.TRANSFER.signature;
  const argument = scriptUtil.getArgument(requiredTransaction, addressIndex);

  const preActions = [() => tx.command.sendScript(transport, script)];
  const actions = [() => tx.command.executeScript(transport, appId, appPrivateKey, argument)];

  const signatures = (await tx.flow.getSignaturesFromCoolWalletV2(
    transport,
    preActions,
    actions,
    SignatureType.EDDSA,
    confirmCB,
    authorizedCB,
  )) as Array<Buffer>;

  const publicKey = await addressUtil.getPublicKey(transport, appPrivateKey, appId, addressIndex);
  const signedTx = await transactionUtil.finalizeTransferTransaction(requiredTransaction, publicKey, signatures[0]);
  return signedTx;
}
