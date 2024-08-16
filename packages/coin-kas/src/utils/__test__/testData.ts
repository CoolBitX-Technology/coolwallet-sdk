import { TxData } from '../../config/type';
import { Transaction } from '../../transaction';

export const testAddressIndex = 0;
// input
export const testNormalInput = {
  txId: '21aa1aff85fc054381f8536d1ab8dbe68f1673a7c67b7ad7816431603c58d32e',
  vout: 1,
  address: 'kaspa:qzcm3y2xe65ne797cmar6ntecfjcdtqf585whum65kgyv20k8jzh6mpgwtm54',
  value: 2355557326,
};

export const testInputWithInvalidAddress = {
  ...testNormalInput,
  address: 'kaspa:qzcm3y2xe65ne797cmar6ntecfjcdtqf585wm65kgyv20k8jzh6mpgwtm54',
};
export const testInputWithoutTxId = {
  ...testNormalInput,
  txId: '',
};
export const testInputWithZeroAmount = {
  ...testNormalInput,
  value: 0,
};
// output
export const testNormalOutput = {
  address: 'kaspa:qq9rmfhgc758j4zquc8yvcngd0qhekt90qqf2czvshvdzdlq7jq8jphmvr028',
  value: 1000,
};
export const testOutputWithInvalidAddress = {
  ...testNormalOutput,
  address: 'kaspa:qq9rmfhgc758j4zyvcngd0qhekt90qqf2czvshvdzdlq7jq8jphmvr028',
};
export const testOutputWithZeroAmount = {
  ...testNormalOutput,
  value: 0,
};

export const testOutputValueWithTooManyDecimals = {
  ...testNormalOutput,
  value: 49991291000000000,
};

export const testOutputValueLessThanDust = {
  ...testNormalOutput,
  value: 546,
};

export const testOutputValueMax = {
  ...testNormalOutput,
  value: 2355547146,
};

export const testOutputTooLargeValue = {
  ...testNormalOutput,
  value: 2355580000,
};

// txData
export const testTxData: TxData = {
  inputs: [testNormalInput],
  outputs: [testNormalOutput],
  fee: '10180',
  changeAddress: 'kaspa:qzcm3y2xe65ne797cmar6ntecfjcdtqf585whum65kgyv20k8jzh6mpgwtm54',
  dustSize: '600',
};
export const testTransaction: Transaction = Transaction.fromTxData(testTxData);
const tooLargeInputs = [];
for(let i=0;i<840;i++) {
  tooLargeInputs.push(testNormalInput);
}
export const testTxDataWithLargeInputs: TxData = {
  inputs: tooLargeInputs,
  outputs: [testNormalInput],
  fee: '200000',
  changeAddress: 'kaspa:qzcm3y2xe65ne797cmar6ntecfjcdtqf585whum65kgyv20k8jzh6mpgwtm54',
  dustSize: '600',
};