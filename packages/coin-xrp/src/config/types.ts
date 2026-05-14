import { Transport } from '@coolwallet/core';

export { Transport };

export type BasePayment = {
  TransactionType: string;
  Flags?: number;
  Sequence: number;
  DestinationTag?: number;
  LastLedgerSequence: number;
  Fee: string;
  SigningPubKey?: string;
  Account?: string;
  TxnSignature?: string;
  Memos?: Array<{ Memo: Memo }>;
};

export type Payment = BasePayment & {
  Amount: string;
  Destination: string;
};

export type TokenPayment = BasePayment & {
  Token: IouToken & { value: string };
};

export type Memo = {
  MemoType?: string;
  MemoData: string;
  MemoFormat?: string;
};

export type IouToken = {
  name: string;
  code: string;
  issuer: string;
};

export type Transaction = {
  to: string;
  value: string;
};

export type SignTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  payment: Payment;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type SignMsgType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  message: string;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type SignTrustSetType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  tokenPayment: TokenPayment;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};
