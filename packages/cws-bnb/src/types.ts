/* eslint-disable camelcase  */

export const coinType = 'CA'

type coin = {
  denom: string;
  amount: number;
};

type inputsOutputs = {
  address: string;
  coins: coin[];
}[];

export enum TransactionType {
  TRANSFER = "TRANSFER",
  PLACE_ORDER = "PLACE_ORDER",
  CANCEL_ORDER = "CANCEL_ORDER",
};

export type Transfer = {
  account_number: string,
  chain_id: string,
  data: string | null,
  memo: string,
  msgs: TransferMsg[],
  sequence: string,
  source: string,
}

type TransferMsg = {
  inputs: inputsOutputs;
  outputs: inputsOutputs;
};

export type PlaceOrder = {
  account_number: string,
  chain_id: string,
  data: string | null,
  memo: string,
  msgs: PlaceOrderMsg[],
  sequence: string,
  source: string,
}

type PlaceOrderMsg = {
  id: string,
  ordertype: number,
  price: number,
  quantity: number,
  sender: string,
  side: number,
  symbol: string,
  timeinforce: number
}

export type CancelOrder = {
  account_number: string,
  chain_id: string,
  data: string | null,
  memo: string,
  msgs: CancelOrderMsg[],
  sequence: string,
  source: string,
}

type CancelOrderMsg = {
  symbol: string,
  sender: string,
  refid: string
}

export const typePrefix = {
  MsgSend: "2A2C87FA",
  NewOrderMsg: "CE6DC043",
  CancelOrderMsg: "166E681B",
  StdTx: "F0625DEE",
  PubKeySecp256k1: "EB5AE987",
  SignatureSecp256k1: "7FC4A495",
};