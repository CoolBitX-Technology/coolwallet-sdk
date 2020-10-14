import { transport } from '@coolwallet/core';

export type Output = {
  address: string,
  value: number
}

type Transport = transport.default;

export type signTxType = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  transaction: Transaction,
  addressIndex: number,
  publicKey: string | undefined,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
}

export type Transaction = {
  // [key: string]: any,
  chainId: number,
  nonce: string,
  gasPrice: string,
  gasLimit: string,
  to: string,
  value: string,
  data: string,
  option: Option
}

export type Option = {
  transactionType: transactionType,
  info : {
    symbol: string,
    decimals: string
  }
};

export enum transactionType  {
  TRANSFER = "TRANSFER",
  ERC20 = "ERC20",
  SMART_CONTRACT = "SMART_CONTRACT",
}

export const coinType = '3C'
