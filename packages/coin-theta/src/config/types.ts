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
  Send,
  StakeValidator,
  StakeGuardian,
  StakeEdge,
  Withdraw,
  Smart,
  Evm,
}

export type Transaction =
  SendTransaction |
  StakeValidatorTransaction |
  StakeGuardianTransaction |
  StakeEdgeTransaction |
  WithdrawTransaction |
  SmartTransaction;

export interface BaseTransaction {
  sequence: Integer;
  addressIndex: number;
}

export interface SendTransaction extends BaseTransaction {
  theta: Integer;
  tfuel: Integer;
  toAddr: string;
}

export interface StakeValidatorTransaction extends BaseTransaction {
  theta: Integer;
  toAddr: string;
}

export interface StakeGuardianTransaction extends BaseTransaction {
  theta: Integer;
  holderSummary: string;
}

export interface StakeEdgeTransaction extends BaseTransaction {
  tfuel: Integer;
  holderSummary: string;
}

export enum Purpose {
  Validator = 0,
  Guardian = 1,
  Edge = 2
}

export interface WithdrawTransaction extends BaseTransaction {
  purpose: Purpose;
  toAddr: string;
}

export interface SmartTransaction extends BaseTransaction {
  value: Integer;
  toAddr: string;
  gasLimit: Integer;
  data: string;
}
