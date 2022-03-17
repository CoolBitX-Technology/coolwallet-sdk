import { Transport } from '@coolwallet/core';
import { RESOURCE_CODE } from './params';

export { Transport };

type SignTxData = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  confirmCB: () => void | undefined;
  authorizedCB: () => void | undefined;
};

type Transaction = {
  // [key: string]: any,
  refBlockBytes: string;
  refBlockHash: string;
  expiration: number;
  timestamp: number;
};

export interface NormalTradeData extends SignTxData {
  transaction: NormalContract;
}

export interface NormalContract extends Transaction {
  contract: {
    ownerAddress: string;
    toAddress: string;
    amount: number | string;
  };
}

export interface FreezeData extends SignTxData {
  transaction: FreezeContract;
}

export interface FreezeContract extends Transaction {
  contract: {
    resource: RESOURCE_CODE;
    frozenDuration: number;
    frozenBalance: number | string;
    receiverAddress?: string;
    ownerAddress: string;
  };
}

export interface UnfreezeData extends SignTxData {
  transaction: UnfreezeContract;
}

export interface UnfreezeContract extends Transaction {
  contract: {
    resource: RESOURCE_CODE;
    receiverAddress?: string;
    ownerAddress: string;
  };
}

export interface VoteWitnessData extends SignTxData {
  transaction: VoteWitnessContract;
}

export interface VoteWitnessContract extends Transaction {
  contract: {
    voteAddress: string;
    ownerAddress: string;
    voteCount: number | string;
  };
}

export interface WithdrawBalanceData extends SignTxData {
  transaction: WithdrawBalanceContract;
}

export interface WithdrawBalanceContract extends Transaction {
  contract: {
    ownerAddress: string;
  };
}

export interface TriggerSmartData extends SignTxData {
  transaction: TriggerSmartContract;
}

export interface TriggerSmartContract extends Transaction {
  contract: {
    ownerAddress: string;
    contractAddress: string;
    callValue: number | string;
    data: string;
  };
  feeLimit: number;
  option: Option;
}

export interface TRC20TransferData extends SignTxData {
  transaction: TRC20TransferContract;
}

export interface TRC20TransferContract extends Transaction {
  contract: {
    ownerAddress: string;
    contractAddress: string;
    receiverAddress: string;
    amount: number | string;
  };
  feeLimit: number;
  option: Option;
}

export type Option = {
  info: {
    symbol: string;
    decimals: string;
  };
};

/*
  const refBlockBytes = '';
  const refBlockHash = '';
  const Expiration = '';
  const ownerAddress = '';
  const toAddress = '';
  const amount = '';
  const timestamp = '';
*/
