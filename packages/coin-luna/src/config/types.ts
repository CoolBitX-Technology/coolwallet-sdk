import { Transport } from '@coolwallet/core';

export type SignDataType =
  | SignMsgSendType
  | SignMsgDelegateType
  | SignMsgUndelegateType
  | SignMsgWithdrawDelegationRewardType
  | SignMsgExecuteContractType
  | SignMsgCW20Type;

interface SignType {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  confirmCB: Function | undefined;
  authorizedCB: Function | undefined;
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
export interface SignMsgExecuteContractType extends SignType {
  txType: TX_TYPE.SMART;
  transaction: MsgExecuteContract;
}

export interface SignMsgCW20Type extends SignType {
  txType: TX_TYPE.CW20;
  transaction: MsgCW20;
}

type Luna = {
  chainId: CHAIN_ID;
  feeAmount: number;
  gas: number;
  accountNumber: string;
  sequence: string;
  memo: string;
};

export interface MsgSend extends Luna {
  fromAddress: string;
  toAddress: string;
  amount: number;
}

export interface MsgDelegate extends Luna {
  delegatorAddress: string;
  validatorAddress: string;
  amount: number;
}

export interface MsgUndelegate extends MsgDelegate {}

export interface MsgWithdrawDelegationReward extends Luna {
  delegatorAddress: string;
  validatorAddress: string;
}

export interface MsgExecuteContract extends Luna {
  senderAddress: string;
  contractAddress: string;
  execute_msg: Record<string, any>;
  funds?: {
    denom: string;
    amount: number;
  };
}

export interface MsgCW20 extends Luna {
    senderAddress: string;
    contractAddress: string;
    execute_msg: {
        transfer: {
            amount: string;
            recipient: string;
        }
    }
    funds: undefined;
    option: Option;
}

export type Option = {
  info: {
    symbol: string;
    decimals: string;
  };
};

export enum CHAIN_ID {
  LUNA = 'columbus-5',
}

export enum TX_TYPE {
  SEND = 'MsgSend',
  DELEGATE = 'MsgDelegate',
  UNDELEGATE = 'MsgUndelegate',
  WITHDRAW = 'MsgWithdrawDelegationReward',
  SMART = 'MsgExecuteContract',
  CW20 = 'MsgCW20'
}