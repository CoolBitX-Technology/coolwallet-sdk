import { Transport } from '@coolwallet/core';

export { Transport };

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  payment: Payment;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export interface Payment {
  txType: number;
  senderAccount: number;
  senderAddress: string;
  receiverAddress: string;
  amount: number;
  fee: number;
  nonce: number;
  validUntil?: number;
  memo?: string;
  networkId: number;
}

export enum Networks {
  MAINNET = 0x01,
  DEVNET = 0x00,
}

export enum TxType {
  PAYMENT = 0x00,
  DELEGATION = 0x04,
}

export interface SignTransactionArgs {
  txType: number;
  senderAccount: number;
  senderAddress: string;
  receiverAddress: string;
  amount: number;
  fee: number;
  nonce: number;
  validUntil?: number;
  memo?: string;
  networkId: number;
}