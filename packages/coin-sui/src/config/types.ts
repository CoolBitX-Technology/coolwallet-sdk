import { Transport } from '@coolwallet/core';
import { ObjectRef, Transaction } from '@mysten/sui/transactions';


export interface CoinTransactionInfo {
  amount: string; // unit amount
  toAddress: string;
  gasPayment: Array<ObjectRef>;
  gasPrice: string;
  gasBudget: string;
}

export interface TokenTransactionInfo extends CoinTransactionInfo {
  coinObjects: Array<ObjectRef>;
}

type BaseTransactionArgs = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type TOKEN_TYPE = {
  name: string;
  symbol: string;
  decimals: number;
  suiCoinType: string;
};

export type TokenInfo = {
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
  transactionInfo: string | Uint8Array | Transaction;
}

export interface ArgumentWithBytes {
  bytes: string;
  argument: string;
}
