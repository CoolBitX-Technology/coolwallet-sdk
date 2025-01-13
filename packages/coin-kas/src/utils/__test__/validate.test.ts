import { Transaction } from '../../transaction';
import {
  validateAmountCanDisplayOnProCard,
  validateChange,
  validateDustThreshold,
  validateInputs,
  validateOutputs,
  validateTransaction,
} from '../validate';
import {
  testInputWithInvalidInputPublicKey,
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
  testTxDataWithLargeInputs,
  testInsufficientFeeChange,
  testInvalidChange,
  testNormalChange,
} from './testData';

describe('Test KAS SDK', () => {
  const decimals = 8;
  describe('Test validateInputs', () => {
    it('Test normal input', async () => {
      expect(() => validateInputs([testNormalInput])).not.toThrowError();
    });

    it('Test without inputs', async () => {
      expect(() => validateInputs([])).toThrowErrorMatchingInlineSnapshot(
        `"error function: validateInputs, message: validate: inputs length is zero"`
      );
    });

    it('Test input with invalid public key', async () => {
      expect(() => validateInputs([testInputWithInvalidInputPublicKey])).toThrowErrorMatchingInlineSnapshot(
        `"error function: validateInputs, message: validate: invalid input public key with index: 0, pubkey: "`
      );
    });

    it('Test input without tx id', async () => {
      expect(() => validateInputs([testInputWithoutTxId])).toThrowErrorMatchingInlineSnapshot(
        `"error function: validateInputs, message: validate: invalid txId with index: 0"`
      );
    });

    it('Test input without 0 value', async () => {
      expect(() => validateInputs([testInputWithZeroAmount])).toThrowErrorMatchingInlineSnapshot(
        `"error function: validateInputs, message: validate: invalid input value: 0 with index: 0, should be positive value"`
      );
    });
  });

  describe('Test validateOutputs', () => {
    it('Test normal output', async () => {
      expect(() => validateOutputs([testNormalOutput])).not.toThrowError();
    });

    it('Test without outputs', async () => {
      expect(() => validateOutputs([])).toThrowErrorMatchingInlineSnapshot(
        `"error function: validateOutputs, message: validate: outputs length is zero"`
      );
    });

    it('Test output with invalid address', async () => {
      expect(() => validateOutputs([testOutputWithInvalidAddress])).toThrowErrorMatchingInlineSnapshot(
        `"error function: validateOutputs, message: validate: invalid output address with index: 0, address: kaspa:qq9rmfhgc758j4zyvcngd0qhekt90qqf2czvshvdzdlq7jq8jphmvr028"`
      );
    });

    it('Test output without 0 value', async () => {
      expect(() => validateOutputs([testOutputWithZeroAmount])).toThrowErrorMatchingInlineSnapshot(
        `"error function: validateOutputs, message: validate: invalid output value: 0 with index: 0, should be positive value"`
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
      ).toThrowErrorMatchingInlineSnapshot(
        `"error function: validateAmountCanDisplayOnProCard, message: validate: pro card cannot display more than 8 digits"`
      );
    });
  });

  describe('Test validateDustThreshold with 600 dust', () => {
    it('Test normal transfer amount', async () => {
      expect(() => validateDustThreshold(testNormalOutput.value, testTxData.dustSize)).not.toThrowError();
    });

    it('Test transfer 546 sompi', async () => {
      expect(() =>
        validateDustThreshold(testOutputValueLessThanDust.value, testTxData.dustSize)
      ).toThrowErrorMatchingInlineSnapshot(
        `"error function: validateDustThreshold, message: validate: transfer amount is below the dust threshold(600)"`
      );
    });
  });

  describe('Test validateChange', () => {
    it('Test normal change', async () => {
      expect(() => validateChange(testNormalChange)).not.toThrowError();
    });

    it('Test transaction with invalid change', async () => {
      expect(() => validateChange(testInvalidChange)).toThrowErrorMatchingInlineSnapshot(
        `"error function: validateChange, message: validate: invalid change value: -32854 should be positive value"`
      );
    });
  });

  describe('Test validateTransaction', () => {
    it('Test normal transaction', async () => {
      const transaction = Transaction.fromTxData(testTxData);
      expect(() => validateTransaction(transaction)).not.toThrowError();
    });

    it('Test transaction with insufficient fee', async () => {
      const transaction = Transaction.fromTxData({ ...testTxData, change: testInsufficientFeeChange });
      expect(transaction.feeValue).toBe('1000');
      expect(() => validateTransaction(transaction)).toThrowErrorMatchingInlineSnapshot(
        `"error function: validateFee, message: validate: transaction fee did not exceed 2036 sompi"`
      );
    });

    it('Test transaction with max value', async () => {
      const transaction = Transaction.fromTxData({ ...testTxData, output: testOutputValueMax, change: undefined });
      expect(() => validateTransaction(transaction)).not.toThrowError();
    });

    it('Test transaction with too large mass', async () => {
      const transaction = Transaction.fromTxData(testTxDataWithLargeInputs);
      expect(() => validateTransaction(transaction)).toThrowErrorMatchingInlineSnapshot(
        `"error function: validateMass, message: validate: current mass: 940038, exceeds the maximum allowed mass(100000)"`
      );
    });
  });
});
