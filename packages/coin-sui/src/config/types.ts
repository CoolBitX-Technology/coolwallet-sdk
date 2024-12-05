import { Transport } from "@coolwallet/core";
import { Transaction } from '@mysten/sui/transactions';

export type TOKENTYPE = {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
};

export type TransactionArgs = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: Transaction;
  addressIndex: number;
  tokenInfo?: TOKENTYPE;
  confirmCB?(): void;
  authorizedCB?(): void;
};
