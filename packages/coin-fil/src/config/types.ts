/* eslint-disable @typescript-eslint/ban-types */
import { Transport } from '@coolwallet/core';

export type Integer = string | number;

export interface Options {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  confirmCB?: Function;
  authorizedCB?: Function;
}

export interface InputTransaction {
  addressIndex: number,
  to: string,
  nonce: Integer,
  value: Integer,
  gasLimit: Integer,
  gasFeeCap: Integer,
  gasPremium: Integer,
  method?: number,
  params?: string
}

export interface RawTransaction {
  To: string,
  From: string,
  Nonce: number,
  Value: string, 
  GasLimit: number,
  GasFeeCap: string,
  GasPremium: string,
  Method: number,
  Params: string,
}

export interface SignedTransaction {
  Message: RawTransaction,
  Signature: {
    Data: string,
    Type: number
  }
}
