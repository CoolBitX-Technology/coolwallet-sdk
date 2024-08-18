import { TxData, Input, Output, Change } from '../../config/types';
import { Transaction } from '../../transaction';

// input
export const testNormalInput: Input = {
  preTxHash: '21aa1aff85fc054381f8536d1ab8dbe68f1673a7c67b7ad7816431603c58d32e',
  preIndex: 1,
  pubkeyBuf: Buffer.from('b1b89146cea93cf8bec6fa3d4d79c26586ac09a1e8ebf37aa5904629f63c857d', 'hex'),
  purposeIndex: 44,
  preValue: '2355557326',
  addressIndex: 0,
};
export const testInputWithInvalidInputPublicKey = {
  ...testNormalInput,
  pubkeyBuf: Buffer.alloc(0),
};
export const testInputWithoutTxId = {
  ...testNormalInput,
  preTxHash: '',
};
export const testInputWithZeroAmount = {
  ...testNormalInput,
  preValue: '0',
};
// output
export const testNormalOutput: Output = {
  address: 'kaspa:qq9rmfhgc758j4zquc8yvcngd0qhekt90qqf2czvshvdzdlq7jq8jphmvr028',
  value: '1000',
};
export const testOutputWithInvalidAddress = {
  ...testNormalOutput,
  address: 'kaspa:qq9rmfhgc758j4zyvcngd0qhekt90qqf2czvshvdzdlq7jq8jphmvr028',
};
export const testOutputWithZeroAmount = {
  ...testNormalOutput,
  value: '0',
};
export const testOutputValueWithTooManyDecimals = {
  ...testNormalOutput,
  value: '49991291000000000',
};
export const testOutputValueLessThanDust = {
  ...testNormalOutput,
  value: '546',
};
export const testOutputValueMax = {
  ...testNormalOutput,
  value: '2355547146',
};
export const testOutputTooLargeValue = {
  ...testNormalOutput,
  value: '2355580000',
};
// change
export const testNormalChange: Change = {
  value: '2355546146',
  pubkeyBuf: Buffer.from('b1b89146cea93cf8bec6fa3d4d79c26586ac09a1e8ebf37aa5904629f63c857d', 'hex'),
  purposeIndex: 44,
  addressIndex: 0,
};
export const testInsufficientFeeChange: Change = {
  ...testNormalChange, 
  value: '2355555326',
};
export const testTooLargeChange: Change = {
  ...testNormalChange,
  value: '1978668132840',
};
export const testInvalidChange: Change = {
  ...testNormalChange,
  value: '-32854',
};
// txData
export const testTxData: TxData = {
  version: 0,
  inputs: [testNormalInput],
  output: testNormalOutput,
  change: testNormalChange,
  dustSize: '600',
};
export const testTransaction: Transaction = Transaction.fromTxData(testTxData);
const testTooLargeInputs = [];
for (let i = 0; i < 840; i++) {
  testTooLargeInputs.push(testNormalInput);
}
export const testTxDataWithLargeInputs: TxData = {
  ...testTxData,
  inputs: testTooLargeInputs,
  output: testNormalOutput,
  change: testTooLargeChange,
  dustSize: '600',
};
