import omit from 'lodash/omit';
import { formatHex } from './string';
import type { EIP1559Transaction, LegacyTransaction } from '../transaction/types';

class Layout {
  property: string;
  span: number;

  constructor(property: string, span: number) {
    this.property = property;
    this.span = span;
  }

  encode(value: string | number): Buffer {
    const buffer = Buffer.alloc(this.span);
    if (typeof value === 'string') {
      const stringBuffer = Buffer.from(formatHex(value), 'hex');
      stringBuffer.copy(buffer, this.span - stringBuffer.length);
    } else {
      buffer.writeInt32BE(value, 0);
    }

    return buffer;
  }
}

class Structure {
  fields: Layout[];

  constructor(fields: Layout[]) {
    this.fields = fields;
  }

  encode(properties: Record<string, string | number>): Buffer[] {
    return this.fields
      .map((field) => {
        const value = properties[field.property];
        return field?.encode(value);
      })
      .filter((e) => e) as Buffer[];
  }

  encodeToHex(properties: Record<string, string | number>) {
    return this.encode(properties).reduce((memo, buffer) => {
      return (memo += buffer.toString('hex'));
    }, '');
  }
}

function encodeLegacyTransactionToSE(transaction: LegacyTransaction['transaction']) {
  const LegacyTransferTransactionStructure = new Structure([
    new Layout('to', 20),
    new Layout('value', 32),
    new Layout('gasPrice', 10),
    new Layout('gasLimit', 10),
    new Layout('nonce', 8),
  ]);

  return LegacyTransferTransactionStructure.encodeToHex(omit(transaction, ['option']));
}

function encodeLegacyERC20TransactionToSE(transaction: LegacyTransaction['transaction']) {
  const erc20Transaction = {
    ...transaction,
    to: transaction.data.slice(10, 74).replace(/\b(0+)/gi, ''),
    amount: transaction.data.slice(74).replace(/\b(0+)/gi, ''),
  };

  const LegacyERC20TransactionStructure = new Structure([
    new Layout('to', 20),
    new Layout('amount', 32),
    new Layout('gasPrice', 10),
    new Layout('gasLimit', 10),
    new Layout('nonce', 8),
  ]);

  return LegacyERC20TransactionStructure.encodeToHex(omit(erc20Transaction, 'option'));
}

function encodeLegacySmartContractSegmentTransactionToSE(transaction: LegacyTransaction['transaction']) {
  const segmentTransaction = {
    ...transaction,
    data: formatHex(transaction.data).length / 2,
  };

  const LegacySmartContractTransactionStructure = new Structure([
    new Layout('to', 20),
    new Layout('value', 32),
    new Layout('gasPrice', 10),
    new Layout('gasLimit', 10),
    new Layout('nonce', 8),
    new Layout('data', 4),
  ]);

  return LegacySmartContractTransactionStructure.encodeToHex(omit(segmentTransaction, 'option'));
}

function encodeEIP1559TransactionToSE(transaction: EIP1559Transaction['transaction']) {
  const EIP1559TransferTransactionStructure = new Structure([
    new Layout('to', 20),
    new Layout('value', 32),
    new Layout('gasTipCap', 10),
    new Layout('gasFeeCap', 10),
    new Layout('gasLimit', 10),
    new Layout('nonce', 8),
  ]);

  return EIP1559TransferTransactionStructure.encodeToHex(omit(transaction, 'option'));
}

function encodeEIP1559ERC20TransactionToSE(transaction: EIP1559Transaction['transaction']) {
  const erc20Transaction = {
    ...transaction,
    to: transaction.data.slice(10, 74).replace(/\b(0+)/gi, ''),
    amount: transaction.data.slice(74).replace(/\b(0+)/gi, ''),
  };

  const EIP1559ERC20TransactionStructure = new Structure([
    new Layout('to', 20),
    new Layout('amount', 32),
    new Layout('gasTipCap', 10),
    new Layout('gasFeeCap', 10),
    new Layout('gasLimit', 10),
    new Layout('nonce', 8),
  ]);

  return EIP1559ERC20TransactionStructure.encodeToHex(omit(erc20Transaction, 'option'));
}

function encodeEIP1559SmartContractSegmentTransactionToSE(transaction: EIP1559Transaction['transaction']) {
  const segmentTransaction = {
    ...transaction,
    data: formatHex(transaction.data).length / 2,
  };
  const EIP1559SmartContractTransactionStructure = new Structure([
    new Layout('to', 20),
    new Layout('value', 32),
    new Layout('gasTipCap', 10),
    new Layout('gasFeeCap', 10),
    new Layout('gasLimit', 10),
    new Layout('nonce', 8),
    new Layout('data', 4),
  ]);

  return EIP1559SmartContractTransactionStructure.encodeToHex(omit(segmentTransaction, 'option'));
}

export {
  encodeLegacyTransactionToSE,
  encodeLegacyERC20TransactionToSE,
  encodeLegacySmartContractSegmentTransactionToSE,
  encodeEIP1559TransactionToSE,
  encodeEIP1559ERC20TransactionToSE,
  encodeEIP1559SmartContractSegmentTransactionToSE,
};
