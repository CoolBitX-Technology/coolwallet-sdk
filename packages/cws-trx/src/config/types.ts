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
  refBlockBytes: string,
  refBlockHash: string,
  expiration: number,
  timestamp: number
}

export interface NormalTradeData extends SignTxData {
  transaction: NormalContract
}

export interface NormalContract extends Transaction {
  contract: {
    ownerAddress: string,
    toAddress: string,
    amount: number|string,
  }
}

export interface FreezeData extends SignTxData {
  transaction: FreezeContract
}

export interface FreezeContract extends Transaction {
  contract: {
    resource: number,
    frozenDuration: number,
    frozenBalance: number|string,
    receiverAddress?: string,
    ownerAddress: string,
  }
}

export interface UnfreezeData extends SignTxData {
  transaction: UnfreezeContract
}

export interface UnfreezeContract extends Transaction {
  contract: {
    resource: number,
    receiverAddress?: string,
    ownerAddress: string,
  }
}

export interface VoteWitnessData extends SignTxData {
  transaction: VoteWitnessContract
}

export interface VoteWitnessContract extends Transaction {
  contract: {
    voteAddress: string,
    ownerAddress: string,
    voteCount: number|string,
  }
}

export interface WithdrawBalanceData extends SignTxData {
  transaction: WithdrawBalanceContract
}

export interface WithdrawBalanceContract extends Transaction {
  contract: {
    ownerAddress: string,
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
