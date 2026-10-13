import { checkTransferTokenTransaction, checkTransferTransaction } from '../checkParams';
import { addressBalanceToAddress, addressBalanceTransactions } from '../../../tests/addressBalanceTestData';

describe('Test checkParams transfer inputs layout', () => {
  const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
  const amount = '100000000';
  const amountInput = '0008' + '00e1f50500000000'; // CallArg::Pure | 長度 8 | u64 LE
  const toAddressInput = '0020' + toAddress.slice(2); // CallArg::Pure | 長度 32 | address
  const otherInput = '0100' + 'ab'.repeat(32);
  const programmableTransaction = '0000'; // TransactionData::V1 | TransactionKind::ProgrammableTransaction

  function toTransaction(...hexParts: string[]): string {
    return Buffer.from(hexParts.join(''), 'hex').toString('base64');
  }

  const validTransaction = toTransaction(programmableTransaction, '03', amountInput, toAddressInput, otherInput);

  describe.each`
    name       | check
    ${'coin'}  | ${checkTransferTransaction}
    ${'token'} | ${checkTransferTokenTransaction}
  `('$name transfer', ({ check }) => {
    it.each`
      scenario                                  | transaction         | to
      ${'amount is inputs[0], to is inputs[1]'} | ${validTransaction} | ${toAddress}
      ${'uppercase address is normalized'}      | ${validTransaction} | ${toAddress.toUpperCase().replace('0X', '0x')}
    `('passes when $scenario', ({ transaction, to }) => {
      expect(() => check({ transaction, amount, toAddress: to })).not.toThrow();
    });

    it.each`
      scenario                             | transaction
      ${'different amount at inputs[0]'}   | ${toTransaction(programmableTransaction, '02', '0008' + '0100000000000000', toAddressInput)}
      ${'different address at inputs[1]'}  | ${toTransaction(programmableTransaction, '02', amountInput, '0020' + 'cd'.repeat(32))}
      ${'object input before pure inputs'} | ${toTransaction(programmableTransaction, '03', otherInput, amountInput, toAddressInput)}
      ${'address and amount swapped'}      | ${toTransaction(programmableTransaction, '02', toAddressInput, amountInput)}
    `('throws when $scenario', ({ transaction }) => {
      expect(() => check({ transaction, amount, toAddress })).toThrow('is not at the expected input');
    });

    it.each`
      scenario                              | transaction
      ${'not TransactionData::V1'}          | ${toTransaction('0100', '02', amountInput, toAddressInput)}
      ${'not a programmable transaction'}   | ${toTransaction('0001', '02', amountInput, toAddressInput)}
      ${'only one input'}                   | ${toTransaction(programmableTransaction, '01', amountInput)}
      ${'128 or more inputs (2-byte ULEB)'} | ${toTransaction(programmableTransaction, '8001', amountInput, toAddressInput)}
    `('throws when $scenario', ({ transaction }) => {
      expect(() => check({ transaction, amount, toAddress })).toThrow('unsupported transaction layout');
    });
  });

  it.each`
    scenario             | invalidAmount
    ${'decimal amount'}  | ${'0.1'}
    ${'negative amount'} | ${'-1'}
    ${'exceeds u64 max'} | ${'18446744073709551616'}
    ${'not a number'}    | ${'abc'}
  `('throws when amount is not a valid u64: $scenario', ({ invalidAmount }) => {
    expect(() =>
      checkTransferTokenTransaction({ transaction: validTransaction, amount: invalidAmount, toAddress })
    ).toThrow('is not a valid u64');
  });

  it.each(addressBalanceTransactions)('address balance fixture passes: $name', ({ kind, amount, transaction }) => {
    const check = kind === 'token' ? checkTransferTokenTransaction : checkTransferTransaction;
    expect(() => check({ transaction, amount, toAddress: addressBalanceToAddress })).not.toThrow();
  });
});
