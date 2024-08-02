import { Transport } from '@coolwallet/core';

export type TokenInfo = {
  symbol: string;
  decimals: string | number;
  address: string;
  signature?: string;
};

type BaseSignTxType<T> = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  transaction: T;
  confirmCB: () => void;
  authorizedCB: () => void;
};

export type SignTransferTxType = BaseSignTxType<TransferTransaction>;
export type SignTransferTokenTxType = BaseSignTxType<TransferTokenTransaction>;

type BaseTransaction = {
  toAddress: string; // support HEX, Bounceable, Non-Bounceable
  amount: string; // nanotons
  seqno: number;
  expireAt?: number; // default: now + 60 seconds
  sendMode?: number; // default: 3, https://docs.ton.org/develop/smart-contracts/messages#message-modes
};

export interface TransferTransaction extends BaseTransaction {
  payload?: string; // memo
}

export interface TransferTokenTransaction extends BaseTransaction {
  payload: {
    jettonAmount: string; // token amount
    toAddress: string;
    forwardAmount: string;
    forwardPayload?: string; // memo
    responseAddress: string;
  };
  tokenInfo: TokenInfo;
}
