import BigNumber from 'bignumber.js';
import { ObjectRef, Transaction } from '@mysten/sui/transactions';

// 測試用：組出呼叫端傳給 SDK 的交易

export interface CoinTransferParams {
  amount: string; // unit amount
  toAddress: string;
  gasPayment: Array<ObjectRef>;
  gasPrice: string;
  gasBudget: string;
}

export interface TokenTransferParams extends CoinTransferParams {
  coinObjects: Array<ObjectRef>;
}

export function getCoinTransaction(transactionInfo: CoinTransferParams, fromAddress: string): Transaction {
  const { toAddress, amount, gasPayment, gasPrice, gasBudget } = transactionInfo;

  const tx = new Transaction();
  tx.setSender(fromAddress);
  tx.setGasBudget(new BigNumber(gasBudget).toNumber());
  tx.setGasPayment(gasPayment);
  tx.setGasPrice(new BigNumber(gasPrice).toNumber());

  const [coin] = tx.splitCoins(tx.gas, [amount]);
  tx.transferObjects([coin], toAddress);
  return tx;
}

export function getTokenTransaction(transactionInfo: TokenTransferParams, fromAddress: string): Transaction {
  const { toAddress, amount, gasPayment, gasPrice, gasBudget, coinObjects } = transactionInfo;

  const tx = new Transaction();
  tx.setSender(fromAddress);
  tx.setGasBudget(new BigNumber(gasBudget).toNumber());
  tx.setGasPayment(gasPayment);
  tx.setGasPrice(new BigNumber(gasPrice).toNumber());

  // amount、toAddress 必須是 inputs[0]、inputs[1]
  const amountArg = tx.pure.u64(amount);
  const toAddressArg = tx.pure.address(toAddress);

  if (coinObjects.length > 1) {
    // merge coins if have more than one coinObjects
    const destination = coinObjects[0];
    const sources = coinObjects.filter((object) => object.objectId !== destination.objectId);
    const sourcesRef = sources.map((source) => tx.objectRef(source));
    tx.mergeCoins(tx.objectRef(destination), sourcesRef);
  }
  // split
  const { digest, objectId, version } = coinObjects[0];
  const [coin] = tx.splitCoins(tx.objectRef({ digest, objectId, version }), [amountArg]);
  tx.transferObjects([coin], toAddressArg);
  return tx;
}

export async function toTransactionBase64(transaction: Transaction): Promise<string> {
  return Buffer.from(await transaction.build()).toString('base64');
}
