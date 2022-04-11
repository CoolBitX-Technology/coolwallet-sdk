import { Transport } from '@coolwallet/core';
import { DenomInfo } from "../config/denomType";

export type SignDataType = SignMsgSendType | SignMsgDelegateType | SignMsgUndelegateType | SignMsgWithdrawDelegationRewardType | SignMsgExecuteContractType

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
export interface SignMsgExecuteContractType extends SignType{
    txType: TX_TYPE.SMART,
    transaction: MsgExecuteContract;
}

type Terra = {
    chainId: CHAIN_ID,
    denom: DenomInfo,
    feeAmount: number,
    feeDenom: DenomInfo,
    gas: number,
    accountNumber: string,
    sequence: string,
    memo: string,
}

export interface MsgSend extends Terra {
    fromAddress: string,
    toAddress: string,
    amount: number,
}

export interface MsgDelegate extends Terra {
    delegatorAddress: string;
    validatorAddress: string;
    amount: number;
}
  
export interface MsgUndelegate extends MsgDelegate {}
  
export interface MsgWithdrawDelegationReward extends Terra {
    delegatorAddress: string;
    validatorAddress: string;
}

export interface MsgExecuteContract extends Terra {
    senderAddress: string,
    contractAddress: string,
    execute_msg: Uint8Array,
    funds?: {
        denom: DenomInfo,
        amount: number
    }
}

export enum CHAIN_ID {
    MAIN = 'columbus-5',
    TEST = 'bombay-12',
}

export enum TX_TYPE {
    SEND = 'MsgSend',
    DELEGATE = 'MsgDelegate',
    UNDELEGATE = 'MsgUndelegate',
    WITHDRAW = 'MsgWithdrawDelegationReward',
    SMART = 'MsgExecuteContract',
}