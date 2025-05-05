import { tx } from '@coolwallet/core';
import * as types from './config/types';
import { Message, MessageV0, VersionedMessage } from './message';

import { Transaction } from './utils/Transaction';
import { VersionedTransaction } from './utils/versionedTransaction';
import { getScriptSigningActions } from './utils/scriptUtil';
import { SignatureType } from '@coolwallet/core/lib/transaction';
import { signVersionedTransactionType } from './config/types';

async function executeScriptWithPreActions(
  signData: types.SignDataType,
  script: string,
  argument: string
): Promise<Buffer | { r: string; s: string }> {
  const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = signData;

  const preActions = [() => tx.command.sendScript(transport, script)];
  const action = () => tx.command.executeScript(transport, appId, appPrivateKey, argument);

  return tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    SignatureType.EDDSA,
    confirmCB,
    authorizedCB,
  );
}

async function signAllTransactions(
  signTxData: types.signVersionedTransactions,
  preActions: Array<() => Promise<void>>
): Promise<Array<Uint8Array>> {
  const { transport, confirmCB, authorizedCB } = signTxData;
  const { actions } = await getScriptSigningActions(signTxData);
  const signatures = (await tx.flow.getSignaturesFromCoolWalletV2(
    transport,
    preActions,
    actions,
    SignatureType.EDDSA,
    confirmCB,
    authorizedCB,
  )) as Array<Buffer>;

  return signatures.map((signature) => {
    return new Uint8Array(signature);
  });
}

async function signTransaction(
  signTxData: types.signTxType,
  rawTx: Transaction | VersionedMessage,
  script: string,
  argument: string
): Promise<string> {
  const signature = (await executeScriptWithPreActions(signTxData, script, argument)) as Buffer;
  if (rawTx instanceof Message || rawTx instanceof MessageV0) {
    const signatureUint8Arrays = (signTxData as signVersionedTransactionType).transaction.signatures;
    signatureUint8Arrays[0] = new Uint8Array(signature);
    const serializedTransaction = new VersionedTransaction(rawTx, signatureUint8Arrays).serialize();
    return Buffer.from(serializedTransaction).toString('hex');
  } else if (rawTx instanceof Transaction) {
    return rawTx.toTxString(signature.toString('hex'));
  } else {
    throw new Error('Invalid transaction type');
  }
}

async function signMessage(signMsgData: types.signMsgType, script: string, argument: string): Promise<string> {
  const signature = await executeScriptWithPreActions(signMsgData, script, argument);
  return signature.toString('hex');
}
export { signTransaction, signMessage, signAllTransactions };
