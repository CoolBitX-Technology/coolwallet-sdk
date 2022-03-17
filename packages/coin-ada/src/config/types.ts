import { Transport } from '@coolwallet/core';

export enum MajorType {
  Uint = 0,
  Byte = 2,
  Array = 4,
}

export type Integer = string | number;

export interface Options {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  confirmCB?: Function;
  authorizedCB?: Function;
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

export interface TransferWithoutFee {
  addrIndexes: number[];
  inputs: Input[];
  output: Output;
  change?: Output;
  ttl: Integer;
}

export interface Transfer extends TransferWithoutFee {
  fee: Integer;
}
