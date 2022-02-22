import { Transport } from '@coolwallet/core';
// export type Transport;

export type txType = {
  fromPubkey: string | Buffer;
  toPubkey: string | Buffer;
  amount: number;
  recentBlockHash: string;
  txTypeIndex: string | undefined;
  data: string;
  dataLength: string | undefined;
};

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: txType;
  confirmCB: Function | undefined;
  authorizedCB: Function | undefined;
};
