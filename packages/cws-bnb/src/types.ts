/* eslint-disable camelcase  */

type coin = {
  denom: string;
  amount: number;
};

type inputsOutputs = {
  address: string;
  coins: coin[];
}[];

type TransferMsg = {
  inputs: inputsOutputs;
  outputs: inputsOutputs;
};

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

type CancelOrderMsg = {
    symbol: string,
    sender: string,
    refid: string
}

// include transfer, placeOrder and cancelOrder
export type Transaction = {
  account_number: string,
  chain_id: string,
  data: string | null,
  memo: string,
  msgs: TransferMsg[] | PlaceOrderMsg[] | CancelOrderMsg[],
  sequence: string,
  source: string,
}

export type Transfer = {
  account_number: string,
  chain_id: string,
  data: string | null,
  memo: string,
  msgs: TransferMsg[],
  sequence: string,
  source: string,
}

export type PlaceOrder = {
  account_number: string,
  chain_id: string,
  data: string | null,
  memo: string,
  msgs: PlaceOrderMsg[],
  sequence: string,
  source: string,
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
