import { Transaction } from '../../transaction';
import {
  validateAmountCanDisplayOnProCard,
  validateDustThreshold,
  validateInputs,
  validateOutputs,
  validateTransaction,
} from '../validate';
import {
  testInputWithInvalidAddress,
  testInputWithoutTxId,
  testInputWithZeroAmount,
  testNormalInput,
  testNormalOutput,
  testOutputWithInvalidAddress,
  testOutputValueWithTooManyDecimals,
  testOutputWithZeroAmount,
  testTxData,
  testOutputValueLessThanDust,
  testOutputValueMax,
  testOutputTooLargeValue,
  testTxDataWithLargeInputs,
} from './testData';

describe('Test validate.ts', () => {
  const decimals = 8;
  describe('Test validateInputs', () => {
    it('Test normal input', async () => {
      expect(() => validateInputs([testNormalInput])).not.toThrowError();
    });

    it('Test without inputs', async () => {
      expect(() => validateInputs([])).toThrowErrorMatchingInlineSnapshot(`"validate: inputs length is zero"`);
    });

    it('Test input with invalid address', async () => {
      expect(() => validateInputs([testInputWithInvalidAddress])).toThrowErrorMatchingInlineSnapshot(
        `"validate: invalid input address with index: 0, address: kaspa:qzcm3y2xe65ne797cmar6ntecfjcdtqf585wm65kgyv20k8jzh6mpgwtm54"`
      );
    });

    it('Test input without tx id', async () => {
      expect(() => validateInputs([testInputWithoutTxId])).toThrowErrorMatchingInlineSnapshot(
        `"validate: invalid txId with index: 0"`
      );
    });

    it('Test input without 0 value', async () => {
      expect(() => validateInputs([testInputWithZeroAmount])).toThrowErrorMatchingInlineSnapshot(
        `"validate: invalid input value: 0 with index: 0, should be positive value"`
      );
    });
  });

  describe('Test validateOutputs', () => {
    it('Test normal output', async () => {
      expect(() => validateOutputs([testNormalOutput])).not.toThrowError();
    });

    it('Test without outputs', async () => {
      expect(() => validateOutputs([])).toThrowErrorMatchingInlineSnapshot(`"validate: outputs length is zero"`);
    });

    it('Test output with invalid address', async () => {
      expect(() => validateOutputs([testOutputWithInvalidAddress])).toThrowErrorMatchingInlineSnapshot(
        `"validate: invalid output address with index: 0, address: kaspa:qq9rmfhgc758j4zyvcngd0qhekt90qqf2czvshvdzdlq7jq8jphmvr028"`
      );
    });

    it('Test output without 0 value', async () => {
      expect(() => validateOutputs([testOutputWithZeroAmount])).toThrowErrorMatchingInlineSnapshot(
        `"validate: invalid output value: 0 with index: 0, should be positive value"`
      );
    });
  });

  describe('Test validateAmountCanDisplayOnProCard', () => {
    it('Test normal transfer amount', async () => {
      expect(() => validateAmountCanDisplayOnProCard(testNormalOutput.value, decimals)).not.toThrowError();
    });

    it('Test more than 8 bits transfer amount', async () => {
      expect(() =>
        validateAmountCanDisplayOnProCard(testOutputValueWithTooManyDecimals.value, decimals)
      ).toThrowErrorMatchingInlineSnapshot(`"validate: pro card cannot display more than 8 digits"`);
    });
  });

  describe('Test validateDustThreshold with 600 dust', () => {
    it('Test normal transfer amount', async () => {
      expect(() => validateDustThreshold(testNormalOutput.value, testTxData.dustSize)).not.toThrowError();
    });

    it('Test transfer 546 sompi', async () => {
      expect(() =>
        validateDustThreshold(testOutputValueLessThanDust.value, testTxData.dustSize)
      ).toThrowErrorMatchingInlineSnapshot(`"validate: transfer amount is below the dust threshold(600)"`);
    });
  });

  describe('Test validateTransaction', () => {
    it('Test normal transaction', async () => {
      const transaction = Transaction.fromTxData(testTxData);
      expect(() => validateTransaction(transaction, testTxData.fee)).not.toThrowError();
    });

    it('Test transaction with insufficient fee', async () => {
      const insufficientFee = '1000';
      const transaction = Transaction.fromTxData({ ...testTxData, fee: insufficientFee });
      expect(() => validateTransaction(transaction, insufficientFee)).toThrowErrorMatchingInlineSnapshot(
        `"validate: transaction fee did not exceed 2036 sompi"`
      );
    });

    it('Test transaction with max value', async () => {
      const transaction = Transaction.fromTxData({ ...testTxData, outputs: [testOutputValueMax] });
      expect(() => validateTransaction(transaction, testTxData.fee)).not.toThrowError();
    });

    it('Test transaction with too large value', async () => {
      const txData = { ...testTxData, outputs: [testOutputTooLargeValue] };
      const transaction = Transaction.fromTxData(txData);
      expect(() => validateTransaction(transaction, testTxData.fee)).toThrowErrorMatchingInlineSnapshot(
        `"validate: invalid change value: -32854"`
      );
    });

    it('Test transaction with too large mass', async () => {
      const transaction = Transaction.fromTxData(testTxDataWithLargeInputs);
      expect(() => validateTransaction(transaction, testTxDataWithLargeInputs.fee)).toThrowErrorMatchingInlineSnapshot(
        `"validate: current mass: 101038, exceeds the maximum allowed mass(100000)"`
      );
    });
  });
});
