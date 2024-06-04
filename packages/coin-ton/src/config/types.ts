import { Transport } from '@coolwallet/core';

export type SignTransferTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  transaction: TransferTxType;
  confirmCB: () => void;
  authorizedCB: () => void;
};

export type TransferTxType = {
  receiver: string; // support HEX, Bounceable, Non-Bounceable
  amount: string; // nanotons
  seqno: number;
  expireAt?: number; // default: now + 60 seconds
  payload?: string; // memo
};
