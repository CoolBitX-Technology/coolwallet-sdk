import { Transport } from '@coolwallet/core';
import { DenomInfo } from '../config/denomType';

interface SignType<
  T extends MsgSend | MsgDelegate | MsgUndelegate | MsgWithdrawDelegatorReward | MsgExecuteContract | MsgCW20 | MsgBlind
> {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  transaction: T;
  confirmCB?(): void;
  authorizedCB?(): void;
}

export type SignMsgSendType = SignType<MsgSend>;
export type SignMsgDelegateType = SignType<MsgDelegate>;
export type SignMsgUndelegateType = SignType<MsgUndelegate>;
export type SignMsgWithdrawDelegatorRewardType = SignType<MsgWithdrawDelegatorReward>;
export type SignMsgExecuteContractType = SignType<MsgExecuteContract>;
export type SignMsgCW20Type = SignType<MsgCW20>;
export type SignMsgBlindType = SignType<MsgBlind>;

export type SignDataType =
  | SignMsgSendType
  | SignMsgDelegateType
  | SignMsgUndelegateType
  | SignMsgWithdrawDelegatorRewardType
  | SignMsgExecuteContractType
  | SignMsgCW20Type;

type Terra = {
  chainId: CHAIN_ID;
  accountNumber: string;
  sequence: string;
  memo: string;
  fee: {
    gas_limit: number;
    denom: DenomInfo;
    amount: number;
  };
};

export interface MsgSend extends Terra {
  fromAddress: string;
  toAddress: string;
  coin: {
    denom: DenomInfo;
    amount: number;
  };
}

export interface MsgDelegate extends Terra {
  delegatorAddress: string;
  validatorAddress: string;
  coin: {
    denom?: DenomInfo;
    amount: number;
  };
}

export interface MsgUndelegate extends Terra {
  delegatorAddress: string;
  validatorAddress: string;
  coin: {
    denom?: DenomInfo;
    amount: number;
  };
}

export interface MsgWithdrawDelegatorReward extends Terra {
  delegatorAddress: string;
  validatorAddress: string;
}

export interface MsgExecuteContract extends Terra {
  senderAddress: string;
  contractAddress: string;
  execute_msg: string | Record<string, any>;
  funds?: {
    denom: DenomInfo;
    amount: number;
  };
}

export interface MsgCW20 extends Terra {
  senderAddress: string;
  contractAddress: string;
  execute_msg: {
    transfer: {
      amount: string;
      recipient: string;
    };
  };
  option?: Option;
}

export interface MsgBlind {
  chainId: CHAIN_ID;
  accountNumber: string;
  sequence: string;
  memo?: string;
  msgs: Record<string, any>[];
  fee: {
    amount: {
      amount: string;
      denom: string;
    }[];
    gas_limit: string;
  };
}

export type Option = {
  info: {
    symbol: string;
    decimals: string;
  };
};

export enum CHAIN_ID {
  MAIN = 'phoenix-1',
  TEST = 'pisco-1',
  CLASSIC = 'columbus-5',
  CLASSIC_TEST = 'bombay-12',
}
