import { Transport } from "@coolwallet/core";
import { Transaction } from '@mysten/sui/transactions';

export type TokenInfo = {
  name: string;
  symbol: string;
  decimals: number;
  suiCoinType: string;
};

export type TransactionArgs = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: Transaction;
  addressIndex: number;
  tokenInfo?: TokenInfo;
  confirmCB?(): void;
  authorizedCB?(): void;
};
