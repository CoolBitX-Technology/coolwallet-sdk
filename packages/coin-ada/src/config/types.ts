import { Transport } from '@coolwallet/core';

// export enum MajorType {
//   Uint = 0,
//   Byte = 2,
//   Text = 3,
//   Array = 4,
//   Map = 5,
//   Tag = 6,
// }

export enum MajorType {
  Uint = 0, // (unsigned integer)
  NegInt = 1, // (negative integer)
  Byte = 2, // (byte string, bstr)
  Text = 3, // (UTF-8 text string)
  Array = 4, // (array)
  Map = 5, // (map)
  Tag = 6, // (semantic tag)
  Simple = 7, // (simple values & floats)
}

export type Integer = string | number;

export enum TxTypes {
  Transfer,
  StakeRegister,
  StakeDelegate,
  StakeDeregister,
  StakeWithdraw,
  StakeRegisterAndDelegate,
  Abstain,
  Message,
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

export interface MessageTransaction {
  receiveAddress: string;
  addrIndex: number;
  message: string;
}
