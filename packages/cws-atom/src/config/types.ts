/* eslint-disable camelcase  */
import { transport } from '@coolwallet/core';
import * as param from './param';
type Transport = transport.default;


export type SignType = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  addressIndex: number,
  transaction: MsgSend | MsgDelegate,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
}


type Cosmos = {
  chainId: param.CHAIN_ID,
  txType: param.TX_TYPE,
  feeAmount: number,
  gas: number,
  accountNumber: string,
  sequence: string,
  memo: string,
}

export interface MsgSend extends Cosmos {
  fromAddress: string,
  toAddress: string,
  amount: number,
}

export interface MsgDelegate extends Cosmos {
  delegatorAddress: string,
  validatorAddress: string,
  amount: number,
}

export interface MsgUndelegate extends MsgDelegate {
}


export interface MsgWithdrawDelegationReward extends Cosmos {
  delegatorAddress: string,
  validatorAddress: string,
}
