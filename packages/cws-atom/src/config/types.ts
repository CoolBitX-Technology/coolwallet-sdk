/* eslint-disable camelcase  */
import { transport } from '@coolwallet/core';
type Transport = transport.default;


export type signType = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  addressIndex: number,
  signObj: Cosmos,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
}


export type Cosmos = {
  chainId: string,
  fromAddress: string,
  toAddress: string,
  amount: number,
  feeAmount: number,
  gas: number,
  accountNumber: string,
  sequence: string,
  memo: string,
}

