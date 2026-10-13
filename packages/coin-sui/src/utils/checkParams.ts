import BigNumber from 'bignumber.js';
import { isValidSuiAddress, isValidSuiObjectId, normalizeSuiAddress, SUI_DECIMALS } from '@mysten/sui/utils';
import { CoinTransactionInfo, TokenTransactionInfo } from '../config/types';
import { Transaction, ObjectRef } from '@mysten/sui/transactions';
import { TRANSACTION_LAYOUT } from '../config/param';

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

// Check transaction is non-empty, valid base64
// Buffer.from(x, 'base64') silently skips invalid characters, so validate the format explicitly.
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
function checkTransactionIsValidBase64(transaction: string): void {
  if (!transaction) throw new Error(`checkParams: transaction is empty.`);
  if (transaction.length % 4 !== 0 || !BASE64_PATTERN.test(transaction))
    throw new Error(`checkParams: transaction is not valid base64.`);
}

// u64 在 BCS 是 8 bytes little-endian
const U64_MAX = new BigNumber(2).pow(64).minus(1);
function toU64LittleEndianHex(amount: string): string {
  const amountBN = new BigNumber(amount);
  if (!amountBN.isInteger() || amountBN.isNegative() || amountBN.isGreaterThan(U64_MAX))
    throw new Error(`checkParams: amount is not a valid u64. amount=${amount}`);
  const bigEndianHex = amountBN.toString(16).padStart(16, '0');
  return Buffer.from(bigEndianHex, 'hex').reverse().toString('hex');
}

// Check the transaction is a programmable transaction whose inputs count fits in one ULEB128 byte,
// otherwise the fixed input offsets would shift
const PROGRAMMABLE_TRANSACTION_HEADER = '0000'; // TransactionData::V1 | TransactionKind::ProgrammableTransaction
const MAX_SINGLE_BYTE_ULEB128 = 0x7f;
function checkTransactionHeader(txHex: string): void {
  const inputCount = parseInt(txHex.slice(4, 6), 16);
  if (!txHex.startsWith(PROGRAMMABLE_TRANSACTION_HEADER) || !(inputCount >= 2 && inputCount <= MAX_SINGLE_BYTE_ULEB128))
    throw new Error(`checkParams: unsupported transaction layout. header=${txHex.slice(0, 6)}`);
}

// Check the pure input at the given offset holds the expected value
function checkTransactionParams(txHex: string, inputOffset: number, valueHex: string, name: string): void {
  const valueLength = valueHex.length / 2;
  const expected = '00' + valueLength.toString(16).padStart(2, '0') + valueHex;
  const actual = txHex.slice(inputOffset * 2, inputOffset * 2 + expected.length);
  if (actual !== expected)
    throw new Error(`checkParams: ${name} is not at the expected input. expected=${expected}, actual=${actual}`);
}

// Check inputs[0] is the send amount and inputs[1] is the to address
function checkTransactionLayout(transaction: string, amount: string, toAddress: string): void {
  const txHex = Buffer.from(transaction, 'base64').toString('hex');
  checkTransactionHeader(txHex);
  checkTransactionParams(txHex, TRANSACTION_LAYOUT.amountInputOffset, toU64LittleEndianHex(amount), 'amount');
  checkTransactionParams(
    txHex,
    TRANSACTION_LAYOUT.toAddressInputOffset,
    normalizeSuiAddress(toAddress).slice(2),
    'toAddress'
  );
}

// Check sender is same as fromAddress
function checkSenderIsSameAsFromAddress(fromAddress: string, sender: string | null | undefined): void {
  if (sender !== fromAddress) throw new Error(`checkParams: sender is not equal to ${fromAddress}, sender=${sender}`);
}

export function checkTransferTransaction(transactionInfo: CoinTransactionInfo): void {
  const { transaction, amount, toAddress } = transactionInfo;
  checkAmountCanDisplayOnProCard(amount, SUI_DECIMALS);
  checkAmountNotZero(amount);
  checkAddressIsValid(toAddress);
  checkTransactionIsValidBase64(transaction);
  checkTransactionLayout(transaction, amount, toAddress);
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
  const { transaction, amount, toAddress } = transactionInfo;
  checkAmountNotZero(amount);
  checkAddressIsValid(toAddress);
  checkTransactionIsValidBase64(transaction);
  checkTransactionLayout(transaction, amount, toAddress);
}
