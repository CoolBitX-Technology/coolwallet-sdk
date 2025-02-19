import { SignTransferTokenTxType } from './config/types';
import * as param from './config/param';
import * as scriptUtil from './utils/scriptUtils';
import * as transactionUtil from './utils/transactionUtils';
import * as addressUtil from './utils/addressUtils';
import { tx } from '@coolwallet/core';
import { SignatureType } from '@coolwallet/core/lib/transaction';
import { checkTransferTokenTransaction } from './utils/checkParams';
import { requireTransferTokenTransaction } from './utils/requireParams';
import BigNumber from 'bignumber.js';

export default async function signTransferTokenTransaction(signTxData: SignTransferTokenTxType): Promise<string> {
  const { transport, appId, appPrivateKey, addressIndex, transaction, confirmCB, authorizedCB } = signTxData;

  checkTransferTokenTransaction(transaction);

  const requiredTransaction = requireTransferTokenTransaction(transaction);

  const jettonAmount = requiredTransaction.payload.jettonAmount;
  const jettonDecimals = requiredTransaction.tokenInfo.decimals;
  const jettonHumanAmount = new BigNumber(jettonAmount).shiftedBy(-jettonDecimals);
  const humanAmountLimit = new BigNumber(1).shiftedBy(8);
  
  let script = param.TRANSFER_TOKEN.script + param.TRANSFER_TOKEN.signature;
  if (jettonHumanAmount.gte(humanAmountLimit)) {
    script = param.TRANSFER_TOKEN_BLIND.script + param.TRANSFER_TOKEN_BLIND.signature;
  }

  const argument = scriptUtil.getTransferTokenArgument(requiredTransaction, addressIndex);

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
  const signedTx = await transactionUtil.finalizeTransferTokenTransaction(
    requiredTransaction,
    publicKey,
    signatures[0]
  );
  return signedTx;
}
