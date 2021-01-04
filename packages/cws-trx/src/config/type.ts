import { transport } from '@coolwallet/core';

export type Output = {
  address: string,
  value: number
}

export type Transport = transport.default;

export type SignTxData = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  transaction: Transaction,
  addressIndex: number,
  publicKey: string | undefined,
  confirmCB: ()=>void | undefined,
  authorizedCB: ()=>void | undefined
}

export type Transaction = {
  // [key: string]: any,
  refBlockBytes: string,
  refBlockHash: string,
  expiration: number,
  timestamp: number
  contract: NormalTrade
}

export type NormalTrade = {
  ownerAddress: string,
  toAddress: string,
  amount: number,
}

/*
  const refBlockBytes = '';
  const refBlockHash = '';
  const Expiration = '';
  const ownerAddress = '';
  const toAddress = '';
  const amount = '';
  const timestamp = '';
*/

export type Option = {
  transactionType: TX_TYPE,
  info : {
    symbol: string,
    decimals: string
  }
};

export enum TX_TYPE {
  TRANSFER_CONTRACT = 'TRANSFER_CONTRACT',
  FREEZE_BALANCE_CONTRACT = 'FREEZE_BALANCE_CONTRACT',
  UNFREEZE_BALANCE_CONTRACT = 'UNFREEZE_BALANCE_CONTRACT',
  VOTE_WITNESS_CONTRACT = 'VOTE_WITNESS_CONTRACT',
  WITHDRAW_BALANCE_CONTRACT = 'WITHDRAW_BALANCE_CONTRACT',
}

