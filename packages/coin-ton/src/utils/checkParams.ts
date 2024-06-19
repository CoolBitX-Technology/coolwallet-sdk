import BigNumber from 'bignumber.js';
import TonWeb from 'tonweb';
import { TransferTokenTransaction, TransferTransaction } from '../config/types';

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
  if (!TonWeb.Address.isValid(address)) throw new Error(`checkParams: address is invalid. address=${address}`);
}

// The script reserves 64 bytes for memo.
function checkMemoLength(memo?: string): void {
  if (new TextEncoder().encode(memo).byteLength > 64) throw new Error(`checkParams: memo too long`);
}

export function checkTransferTransaction(transaction: TransferTransaction): void {
  const { amount, toAddress, payload } = transaction;

  const TON_DECIMALS = 9;

  checkAmountCanDisplayOnProCard(amount, TON_DECIMALS);

  checkAmountNotZero(amount);

  checkAddressIsValid(toAddress);

  checkMemoLength(payload);
}

export function checkTransferTokenTransaction(transaction: TransferTokenTransaction): void {
  const { amount, toAddress: fromTokenAccount, payload, tokenInfo } = transaction;

  const { jettonAmount, toAddress, forwardAmount, forwardPayload, responseAddress } = payload;

  checkAmountCanDisplayOnProCard(jettonAmount, tokenInfo.decimals);

  checkAmountNotZero(amount);
  checkAmountNotZero(jettonAmount);
  checkAmountNotZero(forwardAmount);

  checkAddressIsValid(fromTokenAccount);
  checkAddressIsValid(toAddress);
  checkAddressIsValid(responseAddress);

  checkMemoLength(forwardPayload);
}
