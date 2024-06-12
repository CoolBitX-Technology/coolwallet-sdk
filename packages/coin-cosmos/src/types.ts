import { Transport } from '@coolwallet/core';
import { CoinProps } from './chain/base';
import { TxType } from './constants';

type Cosmos = {
  accountNumber: string | number;
  sequence: string | number;
  memo: string;
  fee: {
    gas_limit: number;
    denom: string | CoinProps;
    amount: string | number;
  };
};

type Mandatory<T> = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  transaction: T & Cosmos;
  confirmCB?(): void;
  authorizedCB?(): void;
};

type MsgSend = {
  fromAddress: string;
  toAddress: string;
  coin: {
    denom: string | CoinProps;
    amount: number;
  };
};

type MsgDelegate = {
  delegatorAddress: string;
  validatorAddress: string;
  coin: {
    denom: string | CoinProps;
    amount: number;
  };
};

type MsgUndelegate = {
  delegatorAddress: string;
  validatorAddress: string;
  coin: {
    denom: string | CoinProps;
    amount: number;
  };
};

type MsgWithdrawDelegatorReward = {
  delegatorAddress: string;
  validatorAddress: string;
};

type signMsgSend = Mandatory<MsgSend>;

type signMsgDelegate = Mandatory<MsgDelegate>;

type signMsgUndelegate = Mandatory<MsgUndelegate>;

type signMsgWithdrawDelegatorReward = Mandatory<MsgWithdrawDelegatorReward>;

type Msg = MsgSend | MsgDelegate | MsgUndelegate | MsgWithdrawDelegatorReward;

type signMsg = Mandatory<Msg> & { type: TxType };

export { signMsg, signMsgSend, signMsgDelegate, signMsgUndelegate, signMsgWithdrawDelegatorReward, Mandatory, Cosmos };
