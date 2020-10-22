import { transport } from '@coolwallet/core';
export type Transport = transport.default;

export type signTxType = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  payment: Payment,
  addressIndex: number,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
}


export type Payment = {
  TransactionType: string | "Payment";
  Flags: number | 2147483648;
  Sequence: number;
  DestinationTag: number;
  LastLedgerSequence: number;

  Amount: string;
  Fee: string;
  SigningPubKey: string;
  Account: string;
  Destination: string;
  TxnSignature?: string;
};

export type Transaction = {
  to: string;
  value: string;
};
