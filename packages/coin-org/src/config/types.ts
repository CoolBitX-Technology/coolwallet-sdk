import { Transport } from '@coolwallet/core';
//export type Transport = transport.default;

export type SignDataType = SignMsgSendType 

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

type Crypto_org_Chain = {
    chainId: CHAIN_ID,
    feeAmount: number,
    gas: number,
    accountNumber: string,
    sequence: string,
    memo: string,
}

export interface MsgSend extends Crypto_org_Chain {
    fromAddress: string,
    toAddress: string,
    amount: number,
}

export enum CHAIN_ID {
    CRO = 'crypto-org-chain-mainnet-1',
}

export enum TX_TYPE {
    SEND = 'MsgSend'
}