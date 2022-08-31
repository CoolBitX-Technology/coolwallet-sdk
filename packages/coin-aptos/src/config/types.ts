import { Transport } from '@coolwallet/core';
export { Transport };

export type Input =
  | SignTransferTxType
  | SignStakeTxType
  | SignSmartTxType
  | SignSCStakeTxType
  | SignSCUnstakeAllTxType
  | SignSCWithdrawAllTxType
  | SignSCUnstakeTxType
  | SignSCWithdrawTxType;

// Transfer

export type SignTransferTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: TransferTxType;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type TransferTxType = {
  sender?: string;
  publicKey?: string;
  receiver: string;
  nonce: number;
  recentBlockHash: string;
  amount: string;
};

// Stake

export type SignStakeTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: StakeTxType;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type StakeTxType = {
  sender?: string;
  publicKey?: string;
  receiver?: string;
  nonce: number;
  recentBlockHash: string;
  amount: string;
  validatorPublicKey: string;
};

// Smart

export type SignSmartTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: SmartTxType;
  confirmCB?(): void;
  authorizedCB?(): void;
};

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
};

// SCStake

export type SignSCStakeTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: SCDelegateTxType;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type SCDelegateTxType = {
  sender?: string;
  publicKey?: string;
  receiver: string;
  nonce: number;
  recentBlockHash: string;
  amount: string;
  gas: string;
};

// SCUnstakeAll

export type SignSCUnstakeAllTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: SCUnstakeAllTxType;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type SCUnstakeAllTxType = {
  sender?: string;
  publicKey?: string;
  receiver: string;
  nonce: number;
  recentBlockHash: string;
  gas: string;
};

// SCWithdrawAll

export type SignSCWithdrawAllTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: SCWithdrawAllTxType;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type SCWithdrawAllTxType = {
  sender?: string;
  publicKey?: string;
  receiver: string;
  nonce: number;
  recentBlockHash: string;
  gas: string;
};

// SCUnstake

export type SignSCUnstakeTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: SCUnstakeTxType;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type SCUnstakeTxType = {
  sender?: string;
  publicKey?: string;
  receiver: string;
  nonce: number;
  recentBlockHash: string;
  amount: string;
  gas: string;
};

// SCWithdraw

export type SignSCWithdrawTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: SCWithdrawTxType;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type SCWithdrawTxType = {
  sender?: string;
  publicKey?: string;
  receiver: string;
  nonce: number;
  recentBlockHash: string;
  amount: string;
  gas: string;
};

// General

export type SignTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: TransactionType;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type TransactionType = {
  sender?: string;
  publicKey?: string;
  receiver?: string;
  nonce: number;
  recentBlockHash: string;
  action: Action;
};

export type Action = {
  txnType: TxnType;
  amount?: string;
  // Stake txn
  validatorPublicKey?: string;
  // Smart contract txn
  gas?: string;
  methodName?: string;
  methodArgs?: Uint8Array;
};

export enum TxnType {
  TRANSFER = 1,
  STAKE = 2,
  SMART = 3,
  SCStake = 4,
  SCUnstakeAll = 5,
  SCWithdrawAll = 6,
  SCUnstake = 7,
  SCWithdraw = 8,
}
