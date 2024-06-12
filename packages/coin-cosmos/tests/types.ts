import type { ChainProps } from '../src';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

type TransactionMandatory = {
  account_number: number;
  sequence: number;
  fee: {
    denom: string;
    amount: number;
    gas_limit: number;
  };
  memo: string;
};

type MsgSendTestCase = {
  toAddress: string;
  coin: {
    denom: string;
    amount: number;
  };
};

type MsgDelegateTestCase = {
  validator_address: string;
  coin: {
    denom: string;
    amount: number;
  };
};

type MsgUndelegateTestCase = {
  validator_address: string;
  coin: {
    denom: string;
    amount: number;
  };
};

type MsgWithdrawDelegatorRewardTestCase = {
  validator_address: string;
};

type TestCases = {
  MsgSend: (MsgSendTestCase & TransactionMandatory)[];
  MsgDelegate?: (MsgDelegateTestCase & TransactionMandatory)[];
  MsgUndelegate?: (MsgUndelegateTestCase & TransactionMandatory)[];
  MsgWithdrawDelegatorReward?: (MsgWithdrawDelegatorRewardTestCase & TransactionMandatory)[];
};

interface TestChain {
  name: string;
  chain: ChainProps;
  tests: TestCases;
}

export { PromiseValue, TransactionMandatory, TestCases, TestChain };
