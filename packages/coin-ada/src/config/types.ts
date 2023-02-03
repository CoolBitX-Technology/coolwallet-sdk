import { Transport } from '@coolwallet/core';

export enum MajorType {
  Uint = 0,
  Byte = 2,
  Array = 4,
}

export type Integer = string | number;

export enum TxTypes {
  Transfer,
  StakeRegister,
  StakeDelegate,
  StakeDeregister,
  StakeWithdraw,
  StakeRegisterAndDelegate,
}

export interface Options {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  confirmCB?(): void;
  authorizedCB?(): void;
}

export interface Input {
  txId: string;
  index: Integer;
}

export interface Output {
  address: string;
  amount: Integer;
}

export interface Witness {
  arg: string;
  vkey: string;
  sig: string;
}

export interface RawTransaction {
  addrIndexes: number[];
  inputs: Input[];
  change?: Output;
  ttl: Integer;
  output?: Output;
  poolKeyHash?: string;
  withdrawAmount?: Integer;
}

export interface Transaction extends RawTransaction {
  fee: Integer;
}
