/* eslint-disable camelcase  */
import { transport } from '@coolwallet/core';
export type Transport = transport.default;

export type SignDataType = SignMsgSendType | SignMsgDelegateType | SignMsgUndelegateType | SignMsgWithdrawDelegationRewardType


interface SignType {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  addressIndex: number,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
}

export interface SignMsgSendType extends SignType {
  txType: TX_TYPE.SEND,
  transaction: MsgSend,
}
export interface SignMsgDelegateType extends SignType {
  txType: TX_TYPE.DELEGATE,
  transaction: MsgDelegate,
}
export interface SignMsgUndelegateType extends SignType {
  txType: TX_TYPE.UNDELEGATE,
  transaction: MsgUndelegate,
}
export interface SignMsgWithdrawDelegationRewardType extends SignType {
  txType: TX_TYPE.WITHDRAW,
  transaction: MsgWithdrawDelegationReward,
}



type Cosmos = {
  chainId: CHAIN_ID,
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

export enum CHAIN_ID {
  ATOM = 'cosmoshub-3',
}

export enum TX_TYPE {
  SEND = 'MsgSend',
  DELEGATE = 'MsgDelegate',
  UNDELEGATE = 'MsgUndelegate',
  WITHDRAW = 'MsgWithdrawDelegationReward',
}
