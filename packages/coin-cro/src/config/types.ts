import { Transport } from '@coolwallet/core';
//export type Transport = transport.default;

export type Callback = () => void;

export type SignDataType =
  | SignMsgSendType
  | SignMsgDelegateType
  | SignMsgUndelegateType
  | SignMsgWithdrawDelegationRewardType;

interface SignType {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  confirmCB?: Callback;
  authorizedCB?: Callback;
}

export interface SignMsgSendType extends SignType {
  txType: TX_TYPE.SEND;
  transaction: MsgSend;
}
export interface SignMsgDelegateType extends SignType {
  txType: TX_TYPE.DELEGATE;
  transaction: MsgDelegate;
}
export interface SignMsgUndelegateType extends SignType {
  txType: TX_TYPE.UNDELEGATE;
  transaction: MsgUndelegate;
}
export interface SignMsgWithdrawDelegationRewardType extends SignType {
  txType: TX_TYPE.WITHDRAW;
  transaction: MsgWithdrawDelegationReward;
}

type Crypto_org_Chain = {
  chainId: CHAIN_ID;
  feeAmount: number;
  gas: number;
  accountNumber: string;
  sequence: string;
  memo: string;
};

export interface MsgSend extends Crypto_org_Chain {
  fromAddress: string;
  toAddress: string;
  amount: number;
}

export interface MsgDelegate extends Crypto_org_Chain {
  delegatorAddress: string;
  validatorAddress: string;
  amount: number;
}

export interface MsgUndelegate extends Crypto_org_Chain {
  delegatorAddress: string;
  validatorAddress: string;
  amount: number;
}

export interface MsgWithdrawDelegationReward extends Crypto_org_Chain {
  delegatorAddress: string;
  validatorAddress: string;
}

export enum CHAIN_ID {
  CRO = 'crypto-org-chain-mainnet-1',
}

export enum TX_TYPE {
  SEND = 'MsgSend',
  DELEGATE = 'MsgDelegate',
  UNDELEGATE = 'MsgUndelegate',
  WITHDRAW = 'MsgWithdrawDelegationReward',
}
