import { SignTransferTokenTxType } from './config/types';
import * as param from './config/param';
import * as scriptUtil from './utils/scriptUtils';
import * as transactionUtil from './utils/transactionUtils';
import * as addressUtil from './utils/addressUtils';
import { apdu, tx } from '@coolwallet/core';
import { SignatureType } from '@coolwallet/core/lib/transaction';
import { checkTransferTokenTransaction } from './utils/checkParams';
import { requireTransferTokenTransaction } from './utils/requireParams';

export default async function signTransferTokenTransaction(signTxData: SignTransferTokenTxType): Promise<string> {
  const { transport, appId, appPrivateKey, addressIndex, transaction, confirmCB, authorizedCB } = signTxData;

  checkTransferTokenTransaction(transaction);

  const requiredTransaction = requireTransferTokenTransaction(transaction);

  const script = param.TRANSFER_TOKEN.script + param.TRANSFER_TOKEN.signature;
  const argument = scriptUtil.getTransferTokenArgument(requiredTransaction, addressIndex);

  const preActions = [() => apdu.tx.sendScript(transport, script)];
  const actions = [() => apdu.tx.executeScript(transport, appId, appPrivateKey, argument)];

  const signatures = (await tx.flow.getSignaturesFromCoolWalletV2(
    transport,
    preActions,
    actions,
    confirmCB,
    authorizedCB,
    SignatureType.EDDSA
  )) as Array<Buffer>;

  const publicKey = await addressUtil.getPublicKey(transport, appPrivateKey, appId, addressIndex);
  const signedTx = await transactionUtil.finalizeTransferTokenTransaction(
    requiredTransaction,
    publicKey,
    signatures[0]
  );
  return signedTx;
}
