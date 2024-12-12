import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import Sui from '../src';
import { Transaction } from '@mysten/sui/transactions';
import { coinFeeInfo, tokenFeeInfo } from './testData';
import {
  CoinTransactionArgs,
  CoinTransactionInfo,
  SmartTransactionArgs,
  TokenInfo,
  TokenTransactionArgs,
  TokenTransactionInfo,
} from '../src/config/types';
import { convertToUnitAmount, getCoinTransaction, getKeyPair, getTokenTransaction } from '../src/utils/transactionUtil';
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
  let props: Mandatory;

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, testWalletInfo.mnemonic);
  });

  describe('Test Get Address', () => {
    it('Test retrieving the address at index 0.', async () => {
      const addressIndex = 0;
      const address = await suiSDK.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
      expect(address).toMatchInlineSnapshot(`"0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae024db"`);
    });
  });

  describe('Test Sign Coin Transfer', () => {
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

    async function get_signed_tx_by_sui_sdk(transactionInfo: CoinTransactionInfo, addressIndex: number) {
      const fromAddress = await suiSDK.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
      const transaction = getCoinTransaction(transactionInfo, fromAddress);
      const keyPair = getKeyPair(testWalletInfo.mnemonic, addressIndex);
      const result = await transaction.sign({ signer: keyPair });
      return JSON.stringify(result);
    }

    async function expect_both_coolwallet_and_suiSdk_signed_tx_is_same(
      transactionInfo: CoinTransactionInfo,
      addressIndex: number
    ) {
      const signedTx1 = await get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex);
      const signedTx2 = await get_signed_tx_by_sui_sdk(transactionInfo, addressIndex);
      expect(signedTx1).toEqual(signedTx2);
    }

    it('Test Coin Transfer Transaction Success With 0.1 SUI', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = convertToUnitAmount('0.1', SUI_DECIMALS);
      const addressIndex = 0;
      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: coinFeeInfo.payment,
        gasPrice: coinFeeInfo.gasPrice,
        gasBudget: coinFeeInfo.gasBudget,
      };
      await expect_both_coolwallet_and_suiSdk_signed_tx_is_same(transactionInfo, addressIndex);
    });

    it('Test Coin Transfer Transaction Failed With 0 SUI', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = '0';
      const addressIndex = 0;
      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: coinFeeInfo.payment,
        gasPrice: coinFeeInfo.gasPrice,
        gasBudget: coinFeeInfo.gasBudget,
      };
      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: not support amount 0"`);
    });

    it('Test Coin Transfer Transaction Success With 99999999 SUI', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = convertToUnitAmount('99999999', SUI_DECIMALS);
      const addressIndex = 0;
      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: coinFeeInfo.payment,
        gasPrice: coinFeeInfo.gasPrice,
        gasBudget: coinFeeInfo.gasBudget,
      };
      await expect_both_coolwallet_and_suiSdk_signed_tx_is_same(transactionInfo, addressIndex);
    });

    it('Test Coin Transfer Transaction Failed With 100000000 SUI', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = convertToUnitAmount('100000000', SUI_DECIMALS);
      const addressIndex = 0;
      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: coinFeeInfo.payment,
        gasPrice: coinFeeInfo.gasPrice,
        gasBudget: coinFeeInfo.gasBudget,
      };
      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: pro card cannot display 9 digits"`);
    });

    it('Test Coin Transfer Transaction Failed With Invalid To Address', async () => {
      const toAddress = '0x2fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = convertToUnitAmount('0.1', SUI_DECIMALS);
      const addressIndex = 0;
      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: coinFeeInfo.payment,
        gasPrice: coinFeeInfo.gasPrice,
        gasBudget: coinFeeInfo.gasBudget,
      };
      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: address is invalid. address=0x2fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09"`
      );
    });

    it('Test Coin Transfer Transaction Failed With Invalid Gas Payment Object Id', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = '0.1';
      const addressIndex = 0;
      const invalidGasPayment = [
        {
          objectId: '0x159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd',
          version: 428891992,
          digest: 'GsuLrrruMfrn6tNpPqGMvXDujTG9QcxRpF1332MCThF4',
        },
      ];

      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: invalidGasPayment,
        gasPrice: coinFeeInfo.gasPrice,
        gasBudget: coinFeeInfo.gasBudget,
      };

      expect(get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: gas payment objectId is not valid. objectId=0x159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd"`
      );
    });

    it('Test Coin Transfer Transaction Failed With Empty Gas Payment', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = '0.1';
      const addressIndex = 0;
      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: [],
        gasPrice: coinFeeInfo.gasPrice,
        gasBudget: coinFeeInfo.gasBudget,
      };

      expect(get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: gas payment not found."`
      );
    });

    it('Test Coin Transfer Transaction Failed With 0 As Gas Price', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = '0.1';
      const addressIndex = 0;

      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: coinFeeInfo.payment,
        gasPrice: '0',
        gasBudget: coinFeeInfo.gasBudget,
      };

      expect(get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: gas price is invalid. gas price=0"`
      );
    });

    it('Test Coin Transfer Transaction Failed With Empty String As Gas Price', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = '0.1';
      const addressIndex = 0;

      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: coinFeeInfo.payment,
        gasPrice: '',
        gasBudget: coinFeeInfo.gasBudget,
      };

      expect(get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: gas price is invalid. gas price="`
      );
    });

    it('Test Coin Transfer Transaction Failed With Invalid String As Gas Price', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = '0.1';
      const addressIndex = 0;

      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: coinFeeInfo.payment,
        gasPrice: 'Invalid String',
        gasBudget: coinFeeInfo.gasBudget,
      };

      expect(get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: gas price is invalid. gas price=Invalid String"`
      );
    });

    it('Test Coin Transfer Transaction Failed With 0 As Gas Budget', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = '0.1';
      const addressIndex = 0;

      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: coinFeeInfo.payment,
        gasPrice: coinFeeInfo.gasPrice,
        gasBudget: '0',
      };

      expect(get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: gas budget is invalid. gas budget=0"`
      );
    });

    it('Test Coin Transfer Transaction Failed With Empty String As Gas Budget', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = '0.1';
      const addressIndex = 0;

      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: coinFeeInfo.payment,
        gasPrice: coinFeeInfo.gasPrice,
        gasBudget: '',
      };

      expect(get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: gas budget is invalid. gas budget="`
      );
    });

    it('Test Coin Transfer Transaction Failed With Invalid String As Gas Budget', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = '0.1';
      const addressIndex = 0;

      const transactionInfo: CoinTransactionInfo = {
        amount,
        toAddress,
        gasPayment: coinFeeInfo.payment,
        gasPrice: coinFeeInfo.gasPrice,
        gasBudget: 'Invalid String',
      };

      expect(get_signed_tx_by_coolwallet_sdk(transactionInfo, addressIndex)).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: gas budget is invalid. gas budget=Invalid String"`
      );
    });
  });

  describe('Test Sign Smart Transaction', () => {
    async function get_signed_tx_by_coolwallet_sdk(transaction: Transaction, addressIndex: number) {
      const signData: SmartTransactionArgs = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex,
        transactionInfo: transaction,
      };
      return await suiSDK.signTransaction(signData);
    }

    async function get_signed_tx_by_sui_sdk(transaction: Transaction, addressIndex: number) {
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
          amount,
          toAddress,
          gasPayment: coinFeeInfo.payment,
          gasPrice: coinFeeInfo.gasPrice,
          gasBudget: coinFeeInfo.gasBudget,
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
          amount,
          toAddress,
          gasPayment: coinFeeInfo.payment,
          gasPrice: coinFeeInfo.gasPrice,
          gasBudget: coinFeeInfo.gasBudget,
        },
        fromAddress
      );
      await expect(
        get_signed_tx_by_coolwallet_sdk(transaction, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: sender is not equal to 0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae024db, sender=0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09"`
      );
    });
  });

  describe('Test Sign Token Transfer Transaction', () => {
    async function get_signed_tx_by_coolwallet_sdk(
      transaction: TokenTransactionInfo,
      tokenInfo: TokenInfo,
      addressIndex: number
    ) {
      const signData: TokenTransactionArgs = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex,
        transactionInfo: transaction,
        tokenInfo,
      };
      return await suiSDK.signTokenTransferTransaction(signData);
    }

    async function get_signed_tx_by_sui_sdk(
      transactionInfo: TokenTransactionInfo,
      tokenInfo: TokenInfo,
      addressIndex: number
    ) {
      const fromAddress = await suiSDK.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
      const transaction = getTokenTransaction(transactionInfo, fromAddress, tokenInfo.decimals);
      const keyPair = getKeyPair(testWalletInfo.mnemonic, addressIndex);
      const result = await transaction.sign({ signer: keyPair });
      return JSON.stringify(result);
    }

    async function expect_both_coolwallet_and_suiSdk_signed_tx_is_same(
      transactionInfo: TokenTransactionInfo,
      tokenInfo: TokenInfo,
      addressIndex: number
    ) {
      const signedTx1 = await get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex);
      const signedTx2 = await get_signed_tx_by_sui_sdk(transactionInfo, tokenInfo, addressIndex);
      expect(signedTx1).toEqual(signedTx2);
    }

    it('Test Token Transfer Transaction Success With 0.001 USDC', async () => {
      const addressIndex = 0;
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: tokenFeeInfo.gasPrice,
        gasBudget: tokenFeeInfo.gasBudget,
        coinObjects: tokenFeeInfo.coinObjects,
      };
      await expect_both_coolwallet_and_suiSdk_signed_tx_is_same(transactionInfo, tokenInfo, addressIndex);
    });

    it('Test Token Transfer Transaction Failed With Invalid Gas Payment Object Id', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const addressIndex = 0;
      const invalidGasPayment = [
        {
          objectId: '0x159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd',
          version: 428891992,
          digest: 'GsuLrrruMfrn6tNpPqGMvXDujTG9QcxRpF1332MCThF4',
        },
      ];

      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: invalidGasPayment,
        gasPrice: tokenFeeInfo.gasPrice,
        gasBudget: tokenFeeInfo.gasBudget,
        coinObjects: tokenFeeInfo.coinObjects,
      };

      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: gas payment objectId is not valid. objectId=0x159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd"`
      );
    });

    it('Test Token Transfer Transaction Failed With Empty Gas Payment', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const addressIndex = 0;

      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: [],
        gasPrice: tokenFeeInfo.gasPrice,
        gasBudget: tokenFeeInfo.gasBudget,
        coinObjects: tokenFeeInfo.coinObjects,
      };

      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: gas payment not found."`);
    });

    it('Test Token Transfer Transaction Failed With 0 As Gas Price', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const addressIndex = 0;

      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: '0',
        gasBudget: tokenFeeInfo.gasBudget,
        coinObjects: tokenFeeInfo.coinObjects,
      };

      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: gas price is invalid. gas price=0"`);
    });

    it('Test Token Transfer Transaction Failed With Empty String As Gas Price', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const addressIndex = 0;

      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: '',
        gasBudget: tokenFeeInfo.gasBudget,
        coinObjects: tokenFeeInfo.coinObjects,
      };

      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: gas price is invalid. gas price="`);
    });

    it('Test Token Transfer Transaction Failed With Invalid String As Gas Price', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const addressIndex = 0;

      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: 'Invalid String',
        gasBudget: tokenFeeInfo.gasBudget,
        coinObjects: tokenFeeInfo.coinObjects,
      };

      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: gas price is invalid. gas price=Invalid String"`);
    });

    it('Test Token Transfer Transaction Failed With 0 As Gas Budget', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const addressIndex = 0;

      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: tokenFeeInfo.gasPrice,
        gasBudget: '0',
        coinObjects: tokenFeeInfo.coinObjects,
      };

      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: gas budget is invalid. gas budget=0"`);
    });

    it('Test Token Transfer Transaction Failed With Empty String As Gas Budget', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const addressIndex = 0;

      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: tokenFeeInfo.gasPrice,
        gasBudget: '',
        coinObjects: tokenFeeInfo.coinObjects,
      };

      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: gas budget is invalid. gas budget="`);
    });

    it('Test Token Transfer Transaction Failed With Invalid String As Gas Budget', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const addressIndex = 0;

      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: tokenFeeInfo.gasPrice,
        gasBudget: 'Invalid String',
        coinObjects: tokenFeeInfo.coinObjects,
      };

      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: gas budget is invalid. gas budget=Invalid String"`);
    });

    it('Test Token Transfer Transaction Failed With Empty Coin Objects', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const addressIndex = 0;

      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: tokenFeeInfo.gasPrice,
        gasBudget: tokenFeeInfo.gasBudget,
        coinObjects: [],
      };

      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: token transfer's coin objects not found."`);
    });

    it('Test Token Transfer Transaction Failed With Invalid Coin Objects Id', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const addressIndex = 0;
      const invalidCoinObjects = [
        {
          objectId: '0xc7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4e',
          version: 428892013,
          digest: 'GUFd3NxnDsWZmDayuFYt85T1jjXjXHtC1iqFxHxt3U66',
        },
      ];

      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: tokenFeeInfo.gasPrice,
        gasBudget: tokenFeeInfo.gasBudget,
        coinObjects: invalidCoinObjects,
      };

      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: gas payment objectId is not valid. objectId=0xc7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4e"`
      );
    });

    it('Test Token Transfer Transaction Failed With 0 USDC', async () => {
      const addressIndex = 0;
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const amount = '0';

      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: tokenFeeInfo.gasPrice,
        gasBudget: tokenFeeInfo.gasBudget,
        coinObjects: tokenFeeInfo.coinObjects,
      };
      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"checkParams: not support amount 0"`);
    });

    it('Test Token Transfer Transaction Failed With Invalid To Address', async () => {
      const addressIndex = 0;
      const toAddress = '0xfd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: tokenFeeInfo.gasPrice,
        gasBudget: tokenFeeInfo.gasBudget,
        coinObjects: tokenFeeInfo.coinObjects,
      };
      await expect(
        get_signed_tx_by_coolwallet_sdk(transactionInfo, tokenInfo, addressIndex)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"checkParams: address is invalid. address=0xfd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09"`
      );
    });

    it('Test Token Transfer Transaction Success With 99999999 USDC', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const addressIndex = 0;
      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('99999999', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: tokenFeeInfo.gasPrice,
        gasBudget: tokenFeeInfo.gasBudget,
        coinObjects: tokenFeeInfo.coinObjects,
      };
      await expect_both_coolwallet_and_suiSdk_signed_tx_is_same(transactionInfo, tokenInfo, addressIndex);
    });

    it('Test Token Transfer Transaction Success With 100000000 USDC', async () => {
      const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
      const addressIndex = 0;
      const tokenInfo: TokenInfo = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      };
      const amount = convertToUnitAmount('100000000', tokenInfo.decimals);

      const transactionInfo: TokenTransactionInfo = {
        amount,
        toAddress,
        gasPayment: tokenFeeInfo.payment,
        gasPrice: tokenFeeInfo.gasPrice,
        gasBudget: tokenFeeInfo.gasBudget,
        coinObjects: tokenFeeInfo.coinObjects,
      };
      await expect_both_coolwallet_and_suiSdk_signed_tx_is_same(transactionInfo, tokenInfo, addressIndex);
    });
  });
});
