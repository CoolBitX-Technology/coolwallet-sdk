import { Coins, Fee, Msg, Numeric } from '@terra-money/terra.js';

export type TxParam = {
  msgs: Record<string, any>[];
  fee: {
    amount: Coins.Data;
    gas_limit: string;
    granter: string;
    payer: string;
  };
  memo?: string;
  gasPrices?: string;
  gasAdjustment?: string;
  account_number?: number;
  sequence?: number;
  feeDenoms?: string[];
};

export interface CreateTxOptions {
  msgs: Msg[];
  fee?: Fee;
  memo?: string;
  gas?: string;
  gasPrices?: Coins.Input;
  gasAdjustment?: Numeric.Input;
  feeDenoms?: string[];
  timeoutHeight?: number;
}

export const txParamParser = (txParam: TxParam): CreateTxOptions => {
  // parse msgs
  const msgs = txParam.msgs.reduce(
    (result: Msg[], msg: any): Msg[] => {
      const convertMsg = Msg.fromData(msg);
      result.push(convertMsg);
      return result;
    },
    []
  );
  // parse fee
  let fee = undefined;
  if (txParam.fee !== undefined) {
    fee = Fee.fromData(txParam.fee);
  }
  return {
    ...txParam,
    msgs,
    fee,
  };
};
