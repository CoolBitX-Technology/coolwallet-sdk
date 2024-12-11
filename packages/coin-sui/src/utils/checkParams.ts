import BigNumber from 'bignumber.js';
import { isValidSuiAddress, SUI_DECIMALS } from '@mysten/sui/utils';
import { CoinTransactionInfo, TokenInfo, TokenTransactionInfo } from '../config/types';
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

export function checkTransferTransaction(transactionInfo: CoinTransactionInfo): void {
  const { amount, toAddress } = transactionInfo;
  const unitAmount = new BigNumber(amount).shiftedBy(SUI_DECIMALS).toFixed();
  checkAmountCanDisplayOnProCard(unitAmount, SUI_DECIMALS);
  checkAmountNotZero(amount);
  checkAddressIsValid(toAddress);
}

export function checkSmartTransaction(transaction: Transaction, fromAddress: string): void {
  const sender = transaction.getData().sender;
  if (sender !== fromAddress) throw new Error(`checkParams: sender is not equal to ${fromAddress}, sender=${sender}`);
}

export function checkTransferTokenTransaction(transactionInfo: TokenTransactionInfo, tokenInfo: TokenInfo): void {
  const { amount, toAddress } = transactionInfo;
  const { decimals } = tokenInfo;
  const unitAmount = new BigNumber(amount).shiftedBy(decimals).toFixed();
  checkAmountCanDisplayOnProCard(unitAmount, decimals);
  checkAmountNotZero(amount);
  checkAddressIsValid(toAddress);
}
