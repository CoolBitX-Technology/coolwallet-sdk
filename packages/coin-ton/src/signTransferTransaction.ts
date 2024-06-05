import { SignTransferTxType, TransferTxType } from './config/types';
import * as param from './config/param';
import * as scriptUtil from './utils/scriptUtils';
import * as transactionUtil from './utils/transactionUtils';
import * as addressUtil from './utils/addressUtils';
import { apdu, tx } from '@coolwallet/core';
import { SignatureType } from '@coolwallet/core/lib/transaction';
import TonWeb from 'tonweb';
import BigNumber from 'bignumber.js';

function checkTransaction(transaction: TransferTxType): void {
  const { amount, receiver } = transaction;

  const amountBN = new BigNumber(amount);

  if (!TonWeb.Address.isValid(receiver)) throw new Error(`checkTransaction: receiver is invalid. receiver=${receiver}`);
  if (amountBN.isZero()) throw new Error(`checkTransaction: not support amount 0`);
  if (amountBN.isGreaterThanOrEqualTo(TonWeb.utils.toNano('100000000').toString())) throw new Error(`checkTransaction: pro card cannot display 9 digits`);
}

export default async function signTransferTransaction(signTxData: SignTransferTxType): Promise<string> {
  const { transport, appId, appPrivateKey, addressIndex, transaction, confirmCB, authorizedCB } = signTxData;

  checkTransaction(transaction);

  const prepTransaction = transactionUtil.getPrepTransaction(transaction);

  const script = param.TRANSFER.script + param.TRANSFER.signature;
  const argument = scriptUtil.getArgument(prepTransaction, addressIndex);

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
  const signedTx = await transactionUtil.composeFinalTransaction(prepTransaction, publicKey, signatures[0]);
  return signedTx;
}
