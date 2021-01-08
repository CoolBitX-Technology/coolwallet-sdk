/* eslint-disable camelcase  */
import { transport } from '@coolwallet/core';
import * as param from './param';
type Transport = transport.default;


export type SignType = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  addressIndex: number,
  transaction: CosmosSend,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
}


export type CosmosSend = {
  chainId: param.CHAIN_ID,
  txType: param.TX_TYPE,
  fromAddress: string,
  toAddress: string,
  amount: number,
  feeAmount: number,
  gas: number,
  accountNumber: string,
  sequence: string,
  memo: string,
}

export type CosmosDelegate = {
  chainId: param.CHAIN_ID,
  txType: param.TX_TYPE,
  fromAddress: string,
  toAddress: string,
  amount: number,
  feeAmount: number,
  gas: number,
  accountNumber: string,
  sequence: string,
  memo: string,
}

