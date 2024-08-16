/*
MIT License

Copyright (c) 2023 OKX.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Modified by coolbitx in 2024
import BigNumber from 'bignumber.js';
import { polymod } from './checksum';
import { prefixToArray } from './utils';
import { decodeAddress } from './address';
import { Transaction } from '../transaction';
import { ScriptType, Input, Output, Change, Payment } from '../config/type';
import { error } from '@coolwallet/core';

export function validate(condition: boolean, funcName: string, message: string) {
  if (!condition) {
    throw new error.SDKError(funcName, message);
  }
}

export function validChecksum(prefix: string, payload: Uint8Array): boolean {
  const prefixData = prefixToArray(prefix);
  const data = new Uint8Array(prefix.length + 1 + payload.length);
  data.set(prefixData);
  data.set([0], prefixData.length);
  data.set(payload, prefixData.length + 1);

  return polymod(data) === 0;
}

function validateAmountIsPostive(value: string | number, funcName: string, errorMessage: string): void {
  const isPositive = new BigNumber(value).isGreaterThan(0);
  validate(isPositive, funcName, errorMessage);
}

function isValidAddress(address: string): boolean {
  if (!address) return false;
  try {
    decodeAddress(address);
    return true;
  } catch (e) {
    return false;
  }
}

// The Pro card cannot display 9-digit integer numbers, so the transaction amount is limited
export function validateAmountCanDisplayOnProCard(transferAmount: string | number, decimals: string | number): void {
  const canDisplay = new BigNumber(transferAmount).shiftedBy(-decimals).isLessThan('100000000');
  validate(canDisplay, validateAmountCanDisplayOnProCard.name, `validate: pro card cannot display more than 8 digits`);
}

export function validateInputs(inputs: Input[]): void {
  validate(inputs.length > 0, validateInputs.name, 'validate: inputs length is zero');
  inputs.forEach((input, index) => {
    validate(
      !!input.pubkeyBuf && input.pubkeyBuf?.length > 0,
      validateInputs.name,
      `validate: invalid input public key with index: ${index}, pubkey: ${input.pubkeyBuf?.toString('hex')}`
    );
    validateAmountIsPostive(
      input.preValue,
      validateInputs.name,
      `validate: invalid input value: ${input.preValue} with index: ${index}, should be positive value`
    );
    validate(input.preTxHash.length > 0, validateInputs.name, `validate: invalid txId with index: ${index}`);
  });
}

export function validateOutput(output: Output): void {
  validate(
    isValidAddress(output.address),
    validateOutput.name,
    `validate: invalid output address: ${output.address}`
  );
  validateAmountIsPostive(
    output.value,
    validateOutput.name,
    `validate: invalid output value: ${output.value} should be positive value`
  );
}

export function validateChange(change: Change): void {
  validate(
    !!change.pubkeyBuf && change.pubkeyBuf?.length > 0,
    validateChange.name,
    `validate: invalid change pubkey: ${change.pubkeyBuf?.toString('hex')}`
  );
  validateAmountIsPostive(
    change.value,
    validateChange.name,
    `validate: invalid change value: ${change.value} should be positive value`
  );
}

export function validateOutputs(outputs: Output[]): void {
  validate(outputs.length > 0, validateOutputs.name, 'validate: outputs length is zero');
  outputs.forEach((output, index) => {
    validate(
      isValidAddress(output.address),
      validateOutputs.name,
      `validate: invalid output address with index: ${index}, address: ${output.address}`
    );
    validateAmountIsPostive(
      output.value,
      validateOutputs.name,
      `validate: invalid output value: ${output.value} with index: ${index}, should be positive value`
    );
  });
}

export function validateDustThreshold(transferAmount: string | number, dustSize = '600'): void {
  const isValidTransferAmount = new BigNumber(transferAmount).isGreaterThanOrEqualTo(new BigNumber(dustSize));
  validate(
    isValidTransferAmount,
    validateDustThreshold.name,
    `validate: transfer amount is below the dust threshold(${dustSize})`
  );
}

function validateFee(minimumFee: number, fee: string): void {
  const isEnoughFee = new BigNumber(fee).isGreaterThanOrEqualTo(new BigNumber(minimumFee));
  validate(isEnoughFee, validateFee.name, `validate: transaction fee did not exceed ${minimumFee} sompi`);
}

function validateMass(mass: number): void {
  const maxAllowMass = 100000;
  const isValidMass = new BigNumber(mass).isLessThanOrEqualTo(new BigNumber(maxAllowMass));
  validate(
    isValidMass,
    validateMass.name,
    `validate: current mass: ${mass}, exceeds the maximum allowed mass(${maxAllowMass})`
  );
}

export function validateTransaction(transaction: Transaction): void {
  const mass = transaction.getTxInfo().mass;
  validateMass(mass);
  const minimumFee = transaction.estimateFee(1000);
  validateFee(minimumFee, transaction.feeValue);
}

export function validatePayment(payment: Payment, funcName: string, scriptType: ScriptType) {
  if (!payment.address) throw new error.SDKError(funcName, `No address for scriptType:'${scriptType}'`);
  if (!payment.outScript) throw new error.SDKError(funcName, `No output for scriptType:'${scriptType}'`);
}
