import { transport } from '@coolwallet/core';

export type Output = {
  address: string,
  value: number
}

type Transport = transport.default;

export type SignTransactionData = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  transaction: Transaction,
  addressIndex: number,
  publicKey: string | undefined,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
}

export type Transaction = {
  // [key: string]: any,
  chainId: number,
  nonce: string,
  gasPrice: string,
  gasLimit: string,
  to: string,
  value: string,
  data: string,
  option: Option
}

export type Option = {
  transactionType: TransactionType,
  info : {
    symbol: string,
    decimals: string
  }
};

export enum TransactionType {
  TRANSFER_CONTRACT = 'TRANSFER_CONTRACT',
  FREEZE_BALANCE_CONTRACT = 'FREEZE_BALANCE_CONTRACT',
  UNFREEZE_BALANCE_CONTRACT = 'UNFREEZE_BALANCE_CONTRACT',
  VOTE_WITNESS_CONTRACT = 'VOTE_WITNESS_CONTRACT',
  WITHDRAW_BALANCE_CONTRACT = 'WITHDRAW_BALANCE_CONTRACT',
}

export const CoinType = 'C3';
