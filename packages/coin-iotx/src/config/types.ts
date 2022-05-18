import { Transport } from '@coolwallet/core';

export type Integer = string | number;

export interface Options {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  confirmCB?: Function;
  authorizedCB?: Function;
}

export enum TxTypes {
  Transfer,
  Execution,
  XRC20Token,
  StakeCreate,
  StakeUnstake,
  StakeWithdraw,
  StakeDeposit,
}

export type Transaction = Transfer | Execution | XRC20Token | StakeCreate | StakeUnstake | StakeWithdraw | StakeDeposit;

export interface BaseTransaction {
  addressIndex: number;
  nonce: Integer;
  gasLimit: Integer;
  gasPrice: Integer;
}

export interface Transfer extends BaseTransaction {
  amount: Integer;
  recipient: string;
  payload?: string;
}

export interface Execution extends BaseTransaction {
  amount: Integer;
  contract: string;
  data?: string;
}

export interface XRC20Token extends BaseTransaction {
  amount: Integer;
  recipient: string;
  tokenDecimals: Integer;
  tokenSymbol: string;
  tokenAddress: string;
  tokenSignature?: string;
}

export interface StakeCreate extends BaseTransaction {
  candidateName: string;
  amount: Integer;
  duration: Integer;
  isAuto: boolean;
  payload?: string;
}

export interface StakeUnstake extends BaseTransaction {
  bucketIndex: Integer;
  payload?: string;
}

export interface StakeWithdraw extends BaseTransaction {
  bucketIndex: Integer;
  payload?: string;
}

export interface StakeDeposit extends BaseTransaction {
  bucketIndex: Integer;
  amount: Integer;
  payload?: string;
}
