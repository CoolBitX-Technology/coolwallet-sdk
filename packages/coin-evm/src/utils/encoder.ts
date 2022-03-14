import isNil from 'lodash/isNil';
import { formatHex } from './string';
import type { EIP1559Transaction, LegacyTransaction } from '../transaction/types';

type Argument = {
  argument: string;
  length?: number;
};

/**
 * EncodeRule show how to encode transaction to hex string.
 * The order is important.
 *
 * @param argument hex string
 * @param length result byte length, optional
 */
type EncodeRule = Map<string, Argument>;

function encodeTransactionToSE(rules: EncodeRule): string {
  let accumulator = '';
  for (const rule of rules.values()) {
    let argument = formatHex(rule.argument);
    if (!isNil(rule.length)) {
      argument = argument.padStart(rule.length * 2, '0');
    }
    accumulator += argument;
  }
  return accumulator;
}

function encodeLegacyTransactionToSE(transaction: LegacyTransaction['transaction']) {
  const rules: EncodeRule = new Map();

  rules.set('to', {
    argument: transaction.to,
    length: 20,
  });
  rules.set('value', {
    argument: transaction.value,
    length: 10,
  });
  rules.set('gasPrice', {
    argument: transaction.gasPrice,
    length: 10,
  });
  rules.set('gasLimit', {
    argument: transaction.gasLimit,
    length: 10,
  });
  rules.set('nonce', {
    argument: transaction.nonce,
    length: 8,
  });
  return encodeTransactionToSE(rules);
}

function encodeLegacyERC20TransactionToSE(transaction: LegacyTransaction['transaction']) {
  const rules: EncodeRule = new Map();

  rules.set('to', {
    argument: transaction.data.slice(10, 74).replace(/\b(0+)/gi, ''),
    length: 20,
  });
  rules.set('amount', {
    argument: transaction.data.slice(74).replace(/\b(0+)/gi, ''),
    length: 12,
  });
  rules.set('gasPrice', {
    argument: transaction.gasPrice,
    length: 10,
  });
  rules.set('gasLimit', {
    argument: transaction.gasLimit,
    length: 10,
  });
  rules.set('nonce', {
    argument: transaction.nonce,
    length: 8,
  });
  return encodeTransactionToSE(rules);
}

function encodeLegacySmartContractSegmentTransactionToSE(transaction: LegacyTransaction['transaction']) {
  const rules = new Map();

  rules.set('to', {
    argument: transaction.to,
    length: 20,
  });
  rules.set('value', {
    argument: transaction.value,
    length: 10,
  });
  rules.set('gasPrice', {
    argument: transaction.gasPrice,
    length: 10,
  });
  rules.set('gasLimit', {
    argument: transaction.gasLimit,
    length: 10,
  });
  rules.set('nonce', {
    argument: transaction.nonce,
    length: 8,
  });
  rules.set('data', {
    argument: (formatHex(transaction.data).length / 2).toString(16),
    length: 4,
  });
  return encodeTransactionToSE(rules);
}

function encodeEIP1559TransactionToSE(transaction: EIP1559Transaction['transaction']) {
  const rules = new Map();

  rules.set('to', {
    argument: transaction.to,
    length: 20,
  });
  rules.set('value', {
    argument: transaction.value,
    length: 10,
  });
  rules.set('gasTipCap', {
    argument: transaction.gasTipCap,
    length: 10,
  });
  rules.set('gasFeeCap', {
    argument: transaction.gasFeeCap,
    length: 10,
  });
  rules.set('gasLimit', {
    argument: transaction.gasLimit,
    length: 10,
  });
  rules.set('nonce', {
    argument: transaction.nonce,
    length: 8,
  });
  return encodeTransactionToSE(rules);
}

function encodeEIP1559ERC20TransactionToSE(transaction: EIP1559Transaction['transaction']) {
  const rules = new Map();

  rules.set('to', {
    argument: transaction.data.slice(10, 74).replace(/\b(0+)/gi, ''),
    length: 20,
  });
  rules.set('amout', {
    argument: transaction.data.slice(74).replace(/\b(0+)/gi, ''),
    length: 12,
  });
  rules.set('gasTipCap', {
    argument: transaction.gasTipCap,
    length: 10,
  });
  rules.set('gasFeeCap', {
    argument: transaction.gasFeeCap,
    length: 10,
  });
  rules.set('gasLimit', {
    argument: transaction.gasLimit,
    length: 10,
  });
  rules.set('nonce', {
    argument: transaction.nonce,
    length: 8,
  });
  return encodeTransactionToSE(rules);
}

function encodeEIP1559SmartContractSegmentTransactionToSE(transaction: EIP1559Transaction['transaction']) {
  const rules = new Map();

  rules.set('to', {
    argument: transaction.to,
    length: 20,
  });
  rules.set('value', {
    argument: transaction.value,
    length: 10,
  });
  rules.set('gasTipCap', {
    argument: transaction.gasTipCap,
    length: 10,
  });
  rules.set('gasFeeCap', {
    argument: transaction.gasFeeCap,
    length: 10,
  });
  rules.set('gasLimit', {
    argument: transaction.gasLimit,
    length: 10,
  });
  rules.set('nonce', {
    argument: transaction.nonce,
    length: 8,
  });
  rules.set('data', {
    argument: (formatHex(transaction.data).length / 2).toString(16),
    length: 4,
  });
  return encodeTransactionToSE(rules);
}

export {
  encodeLegacyTransactionToSE,
  encodeLegacyERC20TransactionToSE,
  encodeLegacySmartContractSegmentTransactionToSE,
  encodeEIP1559TransactionToSE,
  encodeEIP1559ERC20TransactionToSE,
  encodeEIP1559SmartContractSegmentTransactionToSE,
};
