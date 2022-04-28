import { Transport } from '@coolwallet/core';
export { Transport };

// Transfer

export type SignTransferTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: TransferTxType;
  confirmCB?(): void;
  authorizedCB?(): void;
}

export type TransferTxType = {
  sender?: string;
  publicKey?: string; 
  receiver: string;
  nonce: number;
  recentBlockHash: string;
  amount: string;
}

// Stake

export type SignStakeTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: StakeTxType;
  confirmCB?(): void;
  authorizedCB?(): void;
}

export type StakeTxType = {
  sender?: string;
  publicKey?: string; 
  receiver?: string;
  nonce: number;
  recentBlockHash: string;
  amount: string;
  validatorPublicKey: string;
}

// Smart

export type SignSmartTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: SmartTxType;
  confirmCB?(): void;
  authorizedCB?(): void;
}

export type SmartTxType = {
  sender?: string;
  publicKey?: string; 
  receiver: string;
  nonce: number;
  recentBlockHash: string;
  amount?: string;
  gas?: string;
  methodName: string;
  methodArgs: Uint8Array;
}

// General

export type SignTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: TransactionType;
  confirmCB?(): void;
  authorizedCB?(): void;
}

export type TransactionType = {
  sender?: string;
  publicKey?: string; 
  receiver?: string;
  nonce: number;
  recentBlockHash: string;
  action: Action;
}

export type Action = {
  txnType: TxnType;
  amount?: string;
  // Stake txn
  validatorPublicKey?: string;
  // Smart contract txn
  gas?: string;
  methodName?: string;
  methodArgs?: Uint8Array;
}

export enum TxnType {
  TRANSFER = 1,
  STAKE = 2,
  SMART = 3,
  SCSTAKE = 4,
  SCSTAKENOAMOUNT = 5
}
