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
  StakeCreate,
  StakeUnstake,
  StakeWithdraw
}

export type Transaction =
  Transfer |
  Execution |
  StakeCreate |
  StakeUnstake |
  StakeWithdraw;

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

export interface StakeCreate extends BaseTransaction {
  candidateName: string;
  amount: Integer;
  duration: Integer;
  isAuto: boolean;
}

export interface StakeUnstake extends BaseTransaction {
  bucketIndex: Integer;
}

export interface StakeWithdraw extends BaseTransaction {
  bucketIndex: Integer;
}
