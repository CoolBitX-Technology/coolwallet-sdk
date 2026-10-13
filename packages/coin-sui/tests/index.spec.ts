import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import Sui from '../src';
import { Transaction } from '@mysten/sui/transactions';
import { testTokenInfo, testCoinTransactionInfo, testTokenTransactionInfo } from './testData';
import { addressBalanceToAddress, addressBalanceTransactions } from './addressBalanceTestData';
import {
  CoinTransactionArgs,
  CoinTransactionInfo,
  SmartTransactionArgs,
  TokenInfo,
  TokenTransactionArgs,
  TokenTransactionInfo,
} from '../src/config/types';
import { convertToUnitAmount, getKeyPair } from '../src/utils/transactionUtil';
import {
  CoinTransferParams,
  getCoinTransaction,
  getTokenTransaction,
  toTransactionBase64,
  TokenTransferParams,
} from './mockTransactionBuilder';
import { SUI_DECIMALS } from '@mysten/sui/utils';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

const suiSDK = new Sui();

const testWalletInfo = {
  mnemonic: 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo card',
  publicKey: '03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef',
  address: '0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae024db',
};

describe('Test Sui SDK', () => {
  let transport: Transport;
  let cardType: CardType;
  let props: Mandatory;

  beforeAll(async () => {
    if (process.env.CARD === 'go') {
      cardType = CardType.Go;
    } else {
      cardType = CardType.Pro;
    }

    if (cardType === CardType.Go) {
      transport = (await createTransport('http://localhost:9527', CardType.Go))!;
    } else {
      transport = (await createTransport())!;
    }
    props = await initialize(transport, testWalletInfo.mnemonic);
  });

  describe('Test Get Address', () => {
    it('Test retrieving the address at index 0.', async () => {
      const addressIndex = 0;
      const address = await suiSDK.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
      expect(address).toMatchInlineSnapshot(`"0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae024db"`);
    });
  });

  // 參照組：用 Sui SDK 的 keypair 直接簽同一份 tx bytes
  async function get_signed_tx_by_sui_sdk(transaction: string, addressIndex: number) {
    const keyPair = getKeyPair(testWalletInfo.mnemonic, addressIndex);
    const { signature, bytes } = await keyPair.signTransaction(Buffer.from(transaction, 'base64'));
    return JSON.stringify({ signature, bytes });
  }

  describe('Test Sign Coin Transfer', () => {
    const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';

    async function build_transaction_info(params: CoinTransferParams, addressIndex: number) {
      const fromAddress = await suiSDK.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
      const transaction = await toTransactionBase64(getCoinTransaction(params, fromAddress));
      const transactionInfo: CoinTransactionInfo = { transaction, toAddress: params.toAddress, amount: params.amount };
      return transactionInfo;
    }

    async function get_signed_tx_by_coolwallet_sdk(transactionInfo: CoinTransactionInfo, addressIndex: number) {
      const signData: CoinTransactionArgs = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex,
        transactionInfo,
      };
      return await suiSDK.signTransferTransaction(signData);
    }

    async function expect_both_coolwallet_and_suiSdk_signed_tx_is_same(
      params: CoinTransferParams,
      addressIndex: number
    ) {
      const transactionInfo = await build_transaction_info(params, addressIndex);
      const signedTx1 = await get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex);
      const signedTx2 = await get_signed_tx_by_sui_sdk(transactionInfo.transaction, addressIndex);
      expect(signedTx1).toEqual(signedTx2);
    }

    async function build_valid_transaction_info(addressIndex: number) {
      const amount = convertToUnitAmount('0.1', SUI_DECIMALS);
      return await build_transaction_info({ ...testCoinTransactionInfo, amount, toAddress }, addressIndex);
    }

    it('Test Coin Transfer Transaction Success With 0.1 SUI', async () => {
      const amount = convertToUnitAmount('0.1', SUI_DECIMALS);
      await expect_both_coolwallet_and_suiSdk_signed_tx_is_same({ ...testCoinTransactionInfo, amount, toAddress }, 0);
    });

    it('Test Coin Transfer Transaction Success With 99999999 SUI', async () => {
      const amount = convertToUnitAmount('99999999', SUI_DECIMALS);
      await expect_both_coolwallet_and_suiSdk_signed_tx_is_same({ ...testCoinTransactionInfo, amount, toAddress }, 0);
    });

    it('Test Coin Transfer Transaction Failed With 0 SUI', async () => {
      const addressIndex = 0;
      const transactionInfo = await build_transaction_info(
        { ...testCoinTransactionInfo, amount: '0', toAddress },
        addressIndex
      );
      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: not support amount 0"`);
    });

    it('Test Coin Transfer Transaction Failed With 100000000 SUI', async () => {
      const addressIndex = 0;
      const amount = convertToUnitAmount('100000000', SUI_DECIMALS);
      const transactionInfo = await build_transaction_info(
        { ...testCoinTransactionInfo, amount, toAddress },
        addressIndex
      );
      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: pro card cannot display 9 digits"`);
    });

    it('Test Coin Transfer Transaction Failed With Invalid To Address', async () => {
      const addressIndex = 0;
      const transactionInfo = await build_valid_transaction_info(addressIndex);
      const invalidToAddress = '0x2fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      await expect(
        get_signed_tx_by_coolwallet_sdk({ ...transactionInfo, toAddress: invalidToAddress }, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: address is invalid. address=0x2fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09"`
      );
    });

    it('Test Coin Transfer Transaction Failed With Empty Transaction', async () => {
      const addressIndex = 0;
      const transactionInfo = await build_valid_transaction_info(addressIndex);
      await expect(
        get_signed_tx_by_coolwallet_sdk({ ...transactionInfo, transaction: '' }, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: transaction is empty."`);
    });

    it.each`
      scenario                 | transaction
      ${'invalid character'}   | ${'AAAC%AgA'}
      ${'contains whitespace'} | ${'AAAC AgA'}
      ${'missing padding'}     | ${'AAA'}
    `('Test Coin Transfer Transaction Failed With Invalid Base64 Transaction ($scenario)', async ({ transaction }) => {
      const addressIndex = 0;
      const transactionInfo = await build_valid_transaction_info(addressIndex);
      await expect(get_signed_tx_by_coolwallet_sdk({ ...transactionInfo, transaction }, addressIndex)).rejects.toThrow(
        'checkParams: transaction is not valid base64.'
      );
    });

    it('Test Coin Transfer Transaction Failed When To Address Is Not In Transaction', async () => {
      const addressIndex = 0;
      const transactionInfo = await build_valid_transaction_info(addressIndex);
      const otherToAddress = '0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae0aaaa';
      await expect(
        get_signed_tx_by_coolwallet_sdk({ ...transactionInfo, toAddress: otherToAddress }, addressIndex)
      ).rejects.toThrow('is not at the expected input');
    });

    it('Test Coin Transfer Transaction Failed When Amount Is Not In Transaction', async () => {
      const addressIndex = 0;
      const transactionInfo = await build_valid_transaction_info(addressIndex);
      const otherAmount = convertToUnitAmount('0.2', SUI_DECIMALS);
      await expect(
        get_signed_tx_by_coolwallet_sdk({ ...transactionInfo, amount: otherAmount }, addressIndex)
      ).rejects.toThrow('is not at the expected input');
    });
  });

  describe('Test Sign Smart Transaction', () => {
    async function get_signed_tx_by_coolwallet_sdk(
      transactionInfo: string | Uint8Array | Transaction,
      addressIndex: number
    ) {
      const signData: SmartTransactionArgs = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex,
        transactionInfo,
      };
      return await suiSDK.signTransaction(signData);
    }

    async function get_signed_tx_by_sui_sdk(transactionInfo: string | Uint8Array | Transaction, addressIndex: number) {
      const transaction = Transaction.from(transactionInfo);
      const keyPair = getKeyPair(testWalletInfo.mnemonic, addressIndex);
      const result = await transaction.sign({ signer: keyPair });
      return JSON.stringify(result);
    }

    async function expect_both_coolwallet_and_suiSdk_signed_tx_is_same(
      transactionInfo: Transaction,
      addressIndex: number
    ) {
      const signedTx1 = await get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex);
      const signedTx2 = await get_signed_tx_by_sui_sdk(transactionInfo, addressIndex);
      expect(signedTx1).toEqual(signedTx2);
    }

    it('Test Smart Transaction Success With 0.1 SUI', async () => {
      const addressIndex = 0;
      const fromAddress = '0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae024db';
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = convertToUnitAmount('0.1', SUI_DECIMALS);
      const transaction = getCoinTransaction(
        {
          ...testCoinTransactionInfo,
          toAddress,
          amount,
        },
        fromAddress
      );

      await expect_both_coolwallet_and_suiSdk_signed_tx_is_same(transaction, addressIndex);
    });

    it('Test Smart Transaction Failed With Different Sender', async () => {
      const addressIndex = 0;
      const fromAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = convertToUnitAmount('0.1', SUI_DECIMALS);
      const transaction = getCoinTransaction(
        {
          ...testCoinTransactionInfo,
          toAddress,
          amount,
        },
        fromAddress
      );
      await expect(
        get_signed_tx_by_coolwallet_sdk(transaction, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: sender is not equal to 0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae024db, sender=0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09"`
      );
    });

    it('Test Smart Transaction Failed With Empty Gas Payment', async () => {
      const addressIndex = 0;
      const fromAddress = '0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae024db';
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = convertToUnitAmount('0.1', SUI_DECIMALS);
      const transaction = getCoinTransaction(
        {
          ...testCoinTransactionInfo,
          toAddress,
          amount,
          gasPayment: [],
        },
        fromAddress
      );
      await expect(
        get_signed_tx_by_coolwallet_sdk(transaction, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: gas payment not found."`);
    });

    it('Test Smart Transaction Failed With 0 As Gas Price', async () => {
      const addressIndex = 0;
      const fromAddress = '0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae024db';
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = convertToUnitAmount('0.1', SUI_DECIMALS);
      const transaction = getCoinTransaction(
        {
          ...testCoinTransactionInfo,
          toAddress,
          amount,
          gasPrice: '0',
        },
        fromAddress
      );
      await expect(
        get_signed_tx_by_coolwallet_sdk(transaction, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: gas price is invalid. gas price=0"`);
    });

    it('Test Smart Transaction Failed With 0 As Gas Budget', async () => {
      const addressIndex = 0;
      const fromAddress = '0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae024db';
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = convertToUnitAmount('0.1', SUI_DECIMALS);
      const transaction = getCoinTransaction(
        {
          ...testCoinTransactionInfo,
          toAddress,
          amount,
          gasBudget: '0',
        },
        fromAddress
      );
      await expect(
        get_signed_tx_by_coolwallet_sdk(transaction, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: gas budget is invalid. gas budget=0"`);
    });
  });

  describe('Test Sign Token Transfer Transaction', () => {
    const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';

    async function build_transaction_info(params: TokenTransferParams, addressIndex: number) {
      const fromAddress = await suiSDK.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
      const transaction = await toTransactionBase64(getTokenTransaction(params, fromAddress));
      const transactionInfo: TokenTransactionInfo = { transaction, toAddress: params.toAddress, amount: params.amount };
      return transactionInfo;
    }

    async function get_signed_tx_by_coolwallet_sdk(
      transactionInfo: TokenTransactionInfo,
      tokenInfo: TokenInfo,
      addressIndex: number
    ) {
      const signData: TokenTransactionArgs = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex,
        transactionInfo,
        tokenInfo,
      };
      return await suiSDK.signTokenTransferTransaction(signData);
    }

    async function expect_both_coolwallet_and_suiSdk_signed_tx_is_same(
      params: TokenTransferParams,
      tokenInfo: TokenInfo,
      addressIndex: number
    ) {
      const transactionInfo = await build_transaction_info(params, addressIndex);
      const signedTx1 = await get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex);
      const signedTx2 = await get_signed_tx_by_sui_sdk(transactionInfo.transaction, addressIndex);
      expect(signedTx1).toEqual(signedTx2);
    }

    async function build_valid_transaction_info(addressIndex: number) {
      const amount = convertToUnitAmount('0.001', testTokenInfo.decimals);
      return await build_transaction_info({ ...testTokenTransactionInfo, amount, toAddress }, addressIndex);
    }

    it('Test Token Transfer Transaction Success With 0.001 USDC', async () => {
      const amount = convertToUnitAmount('0.001', testTokenInfo.decimals);
      await expect_both_coolwallet_and_suiSdk_signed_tx_is_same(
        { ...testTokenTransactionInfo, amount, toAddress },
        testTokenInfo,
        0
      );
    });

    it('Test Token Transfer Transaction Success With 99999999 USDC', async () => {
      const amount = convertToUnitAmount('99999999', testTokenInfo.decimals);
      await expect_both_coolwallet_and_suiSdk_signed_tx_is_same(
        { ...testTokenTransactionInfo, amount, toAddress },
        testTokenInfo,
        0
      );
    });

    it('Test Token Transfer Transaction Success With 100000000 USDC', async () => {
      const amount = convertToUnitAmount('100000000', testTokenInfo.decimals);
      await expect_both_coolwallet_and_suiSdk_signed_tx_is_same(
        { ...testTokenTransactionInfo, amount, toAddress },
        testTokenInfo,
        0
      );
    });

    it('Test Token Transfer Transaction Failed With 0 USDC', async () => {
      const addressIndex = 0;
      const transactionInfo = await build_transaction_info(
        { ...testTokenTransactionInfo, amount: '0', toAddress },
        addressIndex
      );
      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, testTokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: not support amount 0"`);
    });

    it('Test Token Transfer Transaction Failed With Invalid To Address', async () => {
      const addressIndex = 0;
      const transactionInfo = await build_valid_transaction_info(addressIndex);
      const invalidToAddress = '0xfd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      await expect(
        get_signed_tx_by_coolwallet_sdk(
          { ...transactionInfo, toAddress: invalidToAddress },
          testTokenInfo,
          addressIndex
        )
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: address is invalid. address=0xfd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09"`
      );
    });

    it('Test Token Transfer Transaction Failed With Empty Transaction', async () => {
      const addressIndex = 0;
      const transactionInfo = await build_valid_transaction_info(addressIndex);
      await expect(
        get_signed_tx_by_coolwallet_sdk({ ...transactionInfo, transaction: '' }, testTokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: transaction is empty."`);
    });

    it.each`
      scenario                 | transaction
      ${'invalid character'}   | ${'AAAC%AgA'}
      ${'contains whitespace'} | ${'AAAC AgA'}
      ${'missing padding'}     | ${'AAA'}
    `('Test Token Transfer Transaction Failed With Invalid Base64 Transaction ($scenario)', async ({ transaction }) => {
      const addressIndex = 0;
      const transactionInfo = await build_valid_transaction_info(addressIndex);
      await expect(
        get_signed_tx_by_coolwallet_sdk({ ...transactionInfo, transaction }, testTokenInfo, addressIndex)
      ).rejects.toThrow('checkParams: transaction is not valid base64.');
    });

    it('Test Token Transfer Transaction Failed When To Address Is Not In Transaction', async () => {
      const addressIndex = 0;
      const transactionInfo = await build_valid_transaction_info(addressIndex);
      const otherToAddress = '0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae0aaaa';
      await expect(
        get_signed_tx_by_coolwallet_sdk({ ...transactionInfo, toAddress: otherToAddress }, testTokenInfo, addressIndex)
      ).rejects.toThrow('is not at the expected input');
    });

    it('Test Token Transfer Transaction Failed When Amount Is Not In Transaction', async () => {
      const addressIndex = 0;
      const transactionInfo = await build_valid_transaction_info(addressIndex);
      const otherAmount = convertToUnitAmount('0.002', testTokenInfo.decimals);
      await expect(
        get_signed_tx_by_coolwallet_sdk({ ...transactionInfo, amount: otherAmount }, testTokenInfo, addressIndex)
      ).rejects.toThrow('is not at the expected input');
    });
  });
  describe('Test Sign Transfer With Address Balance', () => {
    it.each(addressBalanceTransactions)('$name', async ({ kind, amount, transaction }) => {
      const addressIndex = 0;
      const transactionInfo = { transaction, toAddress: addressBalanceToAddress, amount };
      const signArgs = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex,
        transactionInfo,
      };
      const signedTx =
        kind === 'token'
          ? await suiSDK.signTokenTransferTransaction({ ...signArgs, tokenInfo: testTokenInfo })
          : await suiSDK.signTransferTransaction(signArgs);
      expect(signedTx).toEqual(await get_signed_tx_by_sui_sdk(transaction, addressIndex));
    });
  });
});
