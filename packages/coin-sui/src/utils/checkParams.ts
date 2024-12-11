import BigNumber from 'bignumber.js';
import { isValidSuiAddress, isValidSuiObjectId, SUI_DECIMALS } from '@mysten/sui/utils';
import { CoinObject, CoinTransactionInfo, TokenTransactionInfo } from '../config/types';
import { Transaction } from '@mysten/sui/transactions';

// The Pro card cannot display 9-digit integer numbers, so the transaction amount is limited
function checkAmountCanDisplayOnProCard(unitAmount: string, decimals: string | number): void {
  if (new BigNumber(unitAmount).shiftedBy(-decimals).isGreaterThanOrEqualTo('100000000'))
    throw new Error(`checkParams: pro card cannot display 9 digits`);
}

// The current script does not support writing 0.
function checkAmountNotZero(amount: string): void {
  if (new BigNumber(amount).isZero()) throw new Error(`checkParams: not support amount 0`);
}

// Check address.
function checkAddressIsValid(address: string): void {
  if (!isValidSuiAddress(address)) throw new Error(`checkParams: address is invalid. address=${address}`);
}

// Check Gas Payment count is not zero and object id is valid
function checkGasPaymentIsValid(gasPayment: Array<CoinObject>): void {
  if (gasPayment.length === 0) throw new Error(`checkParams: gas payment not found.`);
  gasPayment.forEach((object) => {
    if (!isValidSuiObjectId(object.objectId))
      throw new Error(`checkParams: gas payment objectId is not valid. objectId=${object.objectId}`);
  });
}

// Check gas price is not zero or empty
function checkGasPriceNotZero(gasPrice: string): void {
  const gasPriceBN = new BigNumber(gasPrice);
  if (!gasPriceBN.isGreaterThan(0)) throw new Error(`checkParams: gas price is invalid. gas price=${gasPrice}`);
}

// Check gas budget is not zero
function checkGasBudgetNotZero(gasBudget: string): void {
  const gasBudgetBN = new BigNumber(gasBudget);
  if (!gasBudgetBN.isGreaterThan(0)) throw new Error(`checkParams: gas budget is invalid. gas budget=${gasBudget}`);
}

// Check coin objects count is not zero and object id is valid
function checkCoinObjectsIsValid(coinObjects: Array<CoinObject>): void {
  if (coinObjects.length === 0) throw new Error(`checkParams: token transfer's coin objects not found.`);
  coinObjects.forEach((object) => {
    if (!isValidSuiObjectId(object.objectId))
      throw new Error(`checkParams: gas payment objectId is not valid. objectId=${object.objectId}`);
  });
}

export function checkTransferTransaction(transactionInfo: CoinTransactionInfo): void {
  const { amount, toAddress, gasPayment, gasPrice, gasBudget } = transactionInfo;
  const unitAmount = new BigNumber(amount).shiftedBy(SUI_DECIMALS).toFixed();
  checkAmountCanDisplayOnProCard(unitAmount, SUI_DECIMALS); // only for coin because token will do smart script if the length overflow.
  checkAmountNotZero(amount);
  checkAddressIsValid(toAddress);
  checkGasPaymentIsValid(gasPayment);
  checkGasPriceNotZero(gasPrice);
  checkGasBudgetNotZero(gasBudget);
}

export function checkSmartTransaction(transaction: Transaction, fromAddress: string): void {
  const sender = transaction.getData().sender;
  if (sender !== fromAddress) throw new Error(`checkParams: sender is not equal to ${fromAddress}, sender=${sender}`);
}

export function checkTransferTokenTransaction(transactionInfo: TokenTransactionInfo): void {
  const { amount, toAddress, gasPayment, gasPrice, gasBudget, coinObjects } = transactionInfo;
  checkAmountNotZero(amount);
  checkAddressIsValid(toAddress);
  checkGasPaymentIsValid(gasPayment);
  checkGasPriceNotZero(gasPrice);
  checkGasBudgetNotZero(gasBudget);
  checkCoinObjectsIsValid(coinObjects); // only for token
}
