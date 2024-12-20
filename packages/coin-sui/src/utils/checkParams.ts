import BigNumber from 'bignumber.js';
import { isValidSuiAddress, isValidSuiObjectId, SUI_DECIMALS } from '@mysten/sui/utils';
import { CoinTransactionInfo, TokenTransactionInfo } from '../config/types';
import { Transaction, ObjectRef } from '@mysten/sui/transactions';

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
function checkGasPaymentIsValid(gasPayment?: Array<ObjectRef>): void {
  if (!gasPayment ||gasPayment.length === 0) throw new Error(`checkParams: gas payment not found.`);
  gasPayment.forEach((object) => {
    if (!isValidSuiObjectId(object.objectId))
      throw new Error(`checkParams: gas payment objectId is not valid. objectId=${object.objectId}`);
  });
}

// Check gas price is not zero or empty
function checkGasPriceNotZero(gasPrice: string | number): void {
  const gasPriceBN = new BigNumber(gasPrice);
  if (!gasPriceBN.isGreaterThan(0)) throw new Error(`checkParams: gas price is invalid. gas price=${gasPrice}`);
}

// Check gas budget is not zero
function checkGasBudgetNotZero(gasBudget: string | number): void {
  const gasBudgetBN = new BigNumber(gasBudget);
  if (!gasBudgetBN.isGreaterThan(0)) throw new Error(`checkParams: gas budget is invalid. gas budget=${gasBudget}`);
}

// Check coin objects count is not zero and object id is valid
function checkCoinObjectsIsValid(coinObjects?: Array<ObjectRef>): void {
  if (!coinObjects ||coinObjects.length === 0) throw new Error(`checkParams: token transfer's coin objects not found.`);
  coinObjects.forEach((object) => {
    if (!isValidSuiObjectId(object.objectId))
      throw new Error(`checkParams: gas payment objectId is not valid. objectId=${object.objectId}`);
  });
}

// Check sender is same as fromAddress
function checkSenderIsSameAsFromAddress(fromAddress: string, sender: string | null | undefined): void {
  if (sender !== fromAddress) throw new Error(`checkParams: sender is not equal to ${fromAddress}, sender=${sender}`);
}

export function checkTransferTransaction(transactionInfo: CoinTransactionInfo): void {
  const { amount, toAddress, gasPayment, gasPrice, gasBudget } = transactionInfo;
  checkAmountCanDisplayOnProCard(amount, SUI_DECIMALS);
  checkAmountNotZero(amount);
  checkAddressIsValid(toAddress);
  checkGasPaymentIsValid(gasPayment);
  checkGasPriceNotZero(gasPrice);
  checkGasBudgetNotZero(gasBudget);
}

export function checkSmartTransaction(transaction: Transaction, fromAddress: string): void {
  const data = transaction.getData();
  checkSenderIsSameAsFromAddress(fromAddress, data.sender);
  const gasData = data.gasData;
  const payment = gasData.payment || [];
  checkGasPaymentIsValid(payment);
  const gasPrice = gasData.price || '0';
  checkGasPriceNotZero(gasPrice);
  const gasBudget = gasData.budget || '0';
  checkGasBudgetNotZero(gasBudget);
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
