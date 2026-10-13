import { tx } from '@coolwallet/core';
import * as param from './config/param';
import { SignatureType } from '@coolwallet/core/lib/transaction';
import { getCoinTransferArguments, getSmartContractArguments, getTokenTransferArguments } from './utils/scriptUtil';
import { CoinTransactionArgs, SmartTransactionArgs, TokenTransactionArgs } from './config/types';
import { getPublicKey, getSuiAddressByPublicKey } from './utils/addressUtil';
import { getBase64Signature } from './utils/transactionUtil';
import { checkSmartTransaction, checkTransferTokenTransaction, checkTransferTransaction } from './utils/checkParams';
import BigNumber from 'bignumber.js';
import { Transaction } from '@mysten/sui/transactions';

export async function signSmartTransaction(transactionArgs: SmartTransactionArgs): Promise<string> {
  const { transport, appId, appPrivateKey, addressIndex, transactionInfo, confirmCB, authorizedCB } = transactionArgs;

  const publicKey = await getPublicKey(transport, appPrivateKey, appId, addressIndex);
  const fromAddress = getSuiAddressByPublicKey(publicKey);

  let transaction: Transaction;
  if (typeof transactionInfo === 'string' || transactionInfo instanceof Uint8Array) {
    transaction = Transaction.from(transactionInfo);
  } else {
    transaction = transactionInfo;
  }
  checkSmartTransaction(transaction, fromAddress);

  const script = param.SCRIPT.SMART_CONTRACT.scriptWithSignature;
  const base64Transaction = Buffer.from(await transaction.build()).toString('base64');
  const { argument, bytes } = getSmartContractArguments(base64Transaction, addressIndex);

  const preActions = [() => tx.command.sendScript(transport, script)];
  const action = () => tx.command.executeScript(transport, appId, appPrivateKey, argument);

  const signature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    SignatureType.EDDSA,
    confirmCB,
    authorizedCB
  );

  const base64Signature = getBase64Signature(signature as Buffer, publicKey);
  return JSON.stringify({
    signature: base64Signature,
    bytes,
  });
}

export async function signCoinTransferTransaction(transactionArgs: CoinTransactionArgs): Promise<string> {
  const { transport, appId, appPrivateKey, addressIndex, transactionInfo, confirmCB, authorizedCB } = transactionArgs;
  const { transaction } = transactionInfo;

  checkTransferTransaction(transactionInfo);

  const script = param.SCRIPT.TRANSFER.scriptWithSignature;
  const publicKey = await getPublicKey(transport, appPrivateKey, appId, addressIndex);
  const { argument, bytes } = getCoinTransferArguments(transaction, addressIndex);

  const preActions = [() => tx.command.sendScript(transport, script)];
  const action = () => tx.command.executeScript(transport, appId, appPrivateKey, argument);

  const signature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    SignatureType.EDDSA,
    confirmCB,
    authorizedCB
  );

  const base64Signature = getBase64Signature(signature as Buffer, publicKey);
  return JSON.stringify({
    signature: base64Signature,
    bytes,
  });
}

export async function signTokenTransferTransaction(transactionArgs: TokenTransactionArgs): Promise<string> {
  const { transport, appId, appPrivateKey, addressIndex, transactionInfo, tokenInfo, confirmCB, authorizedCB } =
    transactionArgs;
  const { transaction, amount } = transactionInfo;

  checkTransferTokenTransaction(transactionInfo);

  const publicKey = await getPublicKey(transport, appPrivateKey, appId, addressIndex);

  // 若 token amount 大於特定數量就要改走 smart script
  let script = param.SCRIPT.TOKEN_TRANSFER.scriptWithSignature;
  let argumentWithBytes = getTokenTransferArguments(transaction, addressIndex, tokenInfo);
  const humanAmountLimit = new BigNumber(1).shiftedBy(8);
  const humanAmount = new BigNumber(amount).shiftedBy(-tokenInfo.decimals);
  if (humanAmount.isGreaterThanOrEqualTo(humanAmountLimit)) {
    script = param.SCRIPT.SMART_CONTRACT.scriptWithSignature;
    argumentWithBytes = getSmartContractArguments(transaction, addressIndex);
  }

  const { argument, bytes } = argumentWithBytes;
  const preActions = [() => tx.command.sendScript(transport, script)];
  const action = () => tx.command.executeScript(transport, appId, appPrivateKey, argument);

  const signature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    SignatureType.EDDSA,
    confirmCB,
    authorizedCB
  );

  const base64Signature = getBase64Signature(signature as Buffer, publicKey);
  return JSON.stringify({
    signature: base64Signature,
    bytes,
  });
}
