import BigNumber from 'bignumber.js';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { SUI_DECIMALS } from '@mysten/sui/utils';
import { CoinTransactionInfo, TokenTransactionInfo } from '../config/types';

// The Pro card cannot display 9-digit integer numbers, so the transaction amount is limited
function checkAmountCanDisplayOnProCard(transferAmount: string, decimals: string | number): void {
  if (new BigNumber(transferAmount).shiftedBy(-decimals).isGreaterThanOrEqualTo('100000000'))
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
  checkAmountCanDisplayOnProCard(amount, SUI_DECIMALS);
  checkAmountNotZero(amount);
  checkAddressIsValid(toAddress);
}

export function checkTransferTokenTransaction(transactionInfo: TokenTransactionInfo): void {
  const { amount, toAddress } = transactionInfo;

  checkAmountCanDisplayOnProCard(amount, SUI_DECIMALS);
  checkAmountNotZero(amount);
  checkAddressIsValid(toAddress);
}
