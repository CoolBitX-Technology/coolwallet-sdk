import { transport } from '@coolwallet/core';

export type Transport = transport.default;

type SignTxData = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  addressIndex: number,
  confirmCB: () => void | undefined,
  authorizedCB: () => void | undefined
}

type Transaction = {
  // [key: string]: any,
  blockHash: string,
  eraPeriod: number,
  genesisHash: number,
  nonce: number,
  specVersion: number,
  tip: number,
  transactionVersion: number
}

export interface NormalTransferData extends SignTxData {
  transaction: NormalMethod
}

export interface NormalMethod extends Transaction {
  method: {
    dest: string,
    value: string,
    name: string,
    pallet: string
  }
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
  info: {
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
