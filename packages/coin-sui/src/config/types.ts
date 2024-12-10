import { Transport } from '@coolwallet/core';
import { Transaction } from '@mysten/sui/transactions';

export interface CoinObject {
  objectId: string;
  version: number;
  digest: string;
}
export interface CoinTransactionInfo {
  amount: string;
  toAddress: string;
  gasPayment: Array<CoinObject>;
  gasPrice: string;
  gasBudget: string;
}

export interface TokenTransactionInfo extends CoinTransactionInfo {
  coinObject: Array<CoinObject>;
}

type BaseTransactionArgs = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type TokenInfo = {
  name: string;
  symbol: string;
  decimals: number;
  suiCoinType: string;
};

export interface CoinTransactionArgs extends BaseTransactionArgs {
  transactionInfo: CoinTransactionInfo;
}
export interface TokenTransactionArgs extends BaseTransactionArgs {
  transactionInfo: TokenTransactionInfo;
  tokenInfo: TokenInfo;
}
export interface SmartTransactionArgs extends BaseTransactionArgs {
  transactionInfo: Transaction;
}
