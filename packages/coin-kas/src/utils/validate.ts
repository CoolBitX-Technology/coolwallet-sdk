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
import { Input, Output } from '../config/type';
import { Transaction } from '../transaction';

export function validate(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
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

function validateAmountIsPostive(value: string | number, errorMessage: string): void {
  const isPositive = new BigNumber(value).isPositive();
  validate(isPositive, errorMessage)
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
  validate(canDisplay, `validate: pro card cannot display more than 8 digits`)
}

export function validateInputs(inputs: Input[]): void {
  validate(inputs.length > 0, 'validate: inputs length is zero');
  inputs.forEach((input, index) => {
    validate(isValidAddress(input.address), `validate: invalid input address with index: ${index}, address: ${input.address}`);
    validateAmountIsPostive(input.value, `validate: invalid input value: ${input.value}`);
    validate(input.txId.length > 0, `validate: invalid txId`);
  });
}

export function validateOutputs(outputs: Output[]): void {
  validate(outputs.length > 0, 'validate: outputs length is zero');
  outputs.forEach((output, index) => {
    validate(isValidAddress(output.address), `validate: invalid output address with index: ${index}, address: ${output.address}`);
    validateAmountIsPostive(output.value, `validate: invalid output value: ${output.value}`);
  });
}

export function validateChange(changeValue?: string | number): void {
  if (!changeValue) return;
  const isValidChange = new BigNumber(changeValue).isPositive();
  validate(isValidChange, `validate: invalid change value: ${changeValue}`);
}

export function validateDustThreshold(transferAmount: string | number, dustSize = "600"): void {
  const isValidTransferAmount = new BigNumber(transferAmount).isGreaterThanOrEqualTo(new BigNumber(dustSize));
  validate(isValidTransferAmount, `validate: transfer amount is below the dust threshold(${dustSize})`);
}

function validateFee(minimumFee: number, fee: string): void {
  const isEnoughFee = new BigNumber(fee).isGreaterThanOrEqualTo(new BigNumber(minimumFee));
  validate(isEnoughFee, `validate: transaction fee did not exceed ${minimumFee} sompi`);
}

function validateMass(mass: number): void {
  const maxAllowMass = 100000;
  const isValidMass = new BigNumber(mass).isLessThanOrEqualTo(new BigNumber(maxAllowMass));
  validate(isValidMass, `validate: transaction mass exceeds the maximum allowed mass(${maxAllowMass})`);
}

export function validateTransaction(transaction: Transaction, fee: string): void {
  validateChange(transaction?.outputs[1]?.amount);
  const minimumFee = transaction.estimateFee(1000);
  validateFee(minimumFee, fee);
  const mass = transaction.getTxInfo().mass;
  validateMass(mass);
}
