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
  TokenTransfer,
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
  amount: Integer; // lovelace. For TxTypes.TokenTransfer: the single native token sent alongside the min-ADA `amount`.
  token?: TokenAsset;
}

export interface TokenAsset {
  policyId: string; // 28 bytes hex (56 chars)
  assetName: string; // 0-32 bytes hex, empty string means no asset name
  amount: Integer;
  // Display metadata. When omitted, the SDK fills them from the official token list (TOKEN_TYPE).
  // Required (must be supplied by the caller) for an unofficial token, which the card shows as "@symbol".
  symbol?: string;
  decimals?: number;
}

export interface ChangeOutput {
  address: string;
  amount: Integer;
  assets?: TokenAsset[];
}

export interface Witness {
  arg: string;
  vkey: string;
  sig: string;
}

export interface RawTransaction {
  addrIndexes: number[];
  inputs: Input[];
  change?: ChangeOutput;
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
  rolePath: number;
  addrIndex: number;
  message: string;
}
