import { transport } from '@coolwallet/core';
import * as BN from 'bn.js';

export type Transport = transport.default;

export enum Method {
  transfer = '0500',
  bond = '0700',
  unbond = '0702',
}

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
  fromAddress: string,
  blockHash: string,
  blockNumber: string
  era: string,
  genesisHash: string,
  nonce: string,
  specVersion: string,
  tip: string,
  transactionVersion: string,
  version: number
}

export interface NormalTransferData extends SignTxData {
  transaction: NormalMethod
}

export interface NormalMethod extends Transaction {
  method: {
    destAddress: string,
    value: string,
    name: string,
    pallet: string
  }
}

export interface FormatNormalTransferData {
  callIndex: string,
  destAddress: string,
  value: string,
  mortalEra: string,
  nonce: string,
  tip: string,
  specVer: string,
  txVer: string,
  blockHash: string,
  genesisHash: string
}

export interface ToBn {
  toBn: () => BN;
}


export interface ToBnOptions {
  isLe?: boolean;
  isNegative?: boolean;
}

export type FnType = Function;
