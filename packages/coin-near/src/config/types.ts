import { Transport } from '@coolwallet/core';
export { Transport };

export enum TxnType {
  TRANSFER = 1,
  STAKE = 2,
  SMART = 3
}

export interface SignTxType {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: TransactionType;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export interface TransactionType {
  sender: string;
  publicKey: string; 
  receiver: string;
  nonce: number;
  recentBlockHash: string;
  action: Action;
}

export interface Action {
  txnType: TxnType;
  amount: string;
  // Stake txn
  validatorPublicKey?: string;
  // Smart contract txn
  gas?: string;
  methodName?: string;
  methodArgs?: Uint8Array;
}
export interface TransferTransaction2 {
  amount: string;
}
