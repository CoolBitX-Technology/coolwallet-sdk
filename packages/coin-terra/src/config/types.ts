import { Transport } from '@coolwallet/core';

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

type Luna = {
    chainId: CHAIN_ID,
    feeAmount: number,
    gas: number,
    accountNumber: string,
    sequence: string,
    memo: string,
}

export interface MsgSend extends Luna {
    fromAddress: string,
    toAddress: string,
    amount: number,
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

export enum CHAIN_ID {
    LUNA = 'columbus-5',
}

export enum TX_TYPE {
    SEND = 'MsgSend',
    DELEGATE = 'MsgDelegate',
    UNDELEGATE = 'MsgUndelegate',
    WITHDRAW = 'MsgWithdrawDelegationReward',
}