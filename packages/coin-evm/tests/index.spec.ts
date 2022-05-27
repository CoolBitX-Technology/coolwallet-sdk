import { Transport } from '@coolwallet/core';
import { initialize, getTxDetail, DisplayBuilder } from '@coolwallet/testing-library';
import * as bip39 from 'bip39';
import { createTransport } from '@coolwallet/transport-jre-http';
import * as utils from 'web3-utils';
import EVM, { CHAIN } from '../src';
import Wallet from './utils/wallet';
import {
  EIP1559_ERC20_TRANSACTION,
  EIP1559_SMART_CONTRACT_SEGMENT_TRANSACTION,
  EIP1559_SMART_CONTRACT_TRANSACTION,
  EIP1559_TRANSFER_TRANSACTION,
  ERC20_TRANSACTION,
  MESSAGE_TRANSACTION,
  SMART_CONTRACT_SEGMENT_TRANSACTION,
  SMART_CONTRACT_TRANSACTION,
  TRANSFER_TRANSACTION,
  TYPED_DATA_TRANSACTION,
} from './fixtures/transaction';
import type {
  EIP1559Transaction,
  EIP712MessageTransaction,
  EIP712TypedDataTransaction,
  LegacyTransaction,
} from '../src/transaction/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

function isEmpty(str) {
  return !str || str.length === 0;
}

const coinCronos = { name: 'Cronos', api: new EVM(CHAIN.CRONOS) };
const coinPolygon = { name: 'Polygon', api: new EVM(CHAIN.POLYGON) };
const coinAvaxC = { name: 'Avax C', api: new EVM(CHAIN.AVAXC) };
const coinIoTex = { name: 'IoTex', api: new EVM(CHAIN.IOTX) };
// Layer 2
const coinArbitrum = { name: 'Arbitrum', api: new EVM(CHAIN.ARBITRUM) };
const coinOptimism = { name: 'Optimism', api: new EVM(CHAIN.OPTIMISM) };

const TEST_COINS = [coinCronos, coinPolygon, coinAvaxC, coinArbitrum, coinOptimism, coinIoTex];

describe('Test EVM SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  const wallet = new Wallet();

  beforeAll(async () => {
    const mnemonic = bip39.generateMnemonic();
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
    await wallet.setMnemonic(mnemonic);
  });

  it.each(TEST_COINS)('$name: test get address 0', async ({ api }) => {
    const address = await api.getAddress(transport, props.appPrivateKey, props.appId, 0);
    const expectedAddress = await wallet.getAddress(0);
    expect(address.toLowerCase()).toEqual(expectedAddress.toLowerCase());
  });

  it.each(TEST_COINS)('$name test sign transaction', async ({ api }) => {
    for (const transaction of TRANSFER_TRANSACTION) {
      const client: LegacyTransaction = {
        transaction: {
          ...transaction,
          value: utils.toHex(utils.toWei(transaction.value, 'ether')),
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await api.signTransaction(client);
      const expectedSignature = await wallet.signTransaction(client.transaction, api.chain.id);
      expect(signature).toEqual(expectedSignature);
      const txDetail = await getTxDetail(transport, props.appId);
      let expectedTxDetail: string;
      if (isEmpty(api.chain.layer2)) {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .addressPage(transaction.to.toLowerCase())
          .amountPage(+transaction.value)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.layer2)
          .messagePage(api.chain.symbol)
          .addressPage(transaction.to.toLowerCase())
          .amountPage(+transaction.value)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      }
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });

  it.each([coinCronos])('$name test sign erc20 transaction', async ({ api }) => {
    for (const transaction of ERC20_TRANSACTION) {
      const token = api.chain.tokens?.USDT;
      const scale = 10 ** +token.unit;
      const tokenAmount = +transaction.amount;
      const amount = (tokenAmount * scale).toString(16);
      const erc20Data = `0xa9059cbb${transaction.to.slice(2).padStart(64, '0')}${amount.padStart(64, '0')}`;
      const client: LegacyTransaction = {
        transaction: {
          ...transaction,
          to: token.contractAddress,
          data: erc20Data,
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await api.signTransaction(client);
      const expectedSignature = await wallet.signTransaction(client.transaction, api.chain.id);
      expect(signature).toEqual(expectedSignature);
      const txDetail = await getTxDetail(transport, props.appId);
      let expectedTxDetail;
      if (isEmpty(api.chain.layer2)) {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .messagePage('USDT')
          .addressPage(transaction.to.toLowerCase())
          .amountPage(+tokenAmount)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.layer2)
          .messagePage(api.chain.symbol)
          .messagePage('USDT')
          .addressPage(transaction.to.toLowerCase())
          .amountPage(+tokenAmount)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      }
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });

  it.each(TEST_COINS)('$name test sign smart contract transaction', async ({ api }) => {
    for (const transaction of SMART_CONTRACT_TRANSACTION) {
      const client: LegacyTransaction = {
        transaction: {
          ...transaction,
          value: utils.toHex(utils.toWei(transaction.value, 'ether')),
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await api.signTransaction(client);
      const expectedSignature = await wallet.signTransaction(client.transaction, api.chain.id);
      expect(signature).toEqual(expectedSignature);
      const txDetail = await getTxDetail(transport, props.appId);
      let expectedTxDetail: string;
      if (isEmpty(api.chain.layer2)) {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .wrapPage('SMART', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.layer2)
          .messagePage(api.chain.symbol)
          .wrapPage('SMART', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      }
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });

  it.each(TEST_COINS)('$name test sign smart contract segment transaction', async ({ api }) => {
    for (const transaction of SMART_CONTRACT_SEGMENT_TRANSACTION) {
      const client: LegacyTransaction = {
        transaction: {
          ...transaction,
          value: utils.toHex(utils.toWei(transaction.value, 'ether')),
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await api.signTransaction(client);
      const expectedSignature = await wallet.signTransaction(client.transaction, api.chain.id);
      expect(signature).toEqual(expectedSignature);
      const txDetail = await getTxDetail(transport, props.appId);

      let expectedTxDetail: string;
      if (isEmpty(api.chain.layer2)) {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .wrapPage('SMART', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.layer2)
          .messagePage(api.chain.symbol)
          .wrapPage('SMART', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      }
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });

  it.each(TEST_COINS)('$name test sign typed data transaction', async ({ api }) => {
    for (const transaction of TYPED_DATA_TRANSACTION) {
      const client: EIP712TypedDataTransaction = {
        typedData: transaction.typedData(api.chain.id),
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await api.signTypedData(client);
      const expectedSignature = await wallet.signTypedData(client.typedData);
      expect(signature).toEqual(expectedSignature);
      const txDetail = await getTxDetail(transport, props.appId);
      let expectedTxDetail: string;
      if (isEmpty(api.chain.layer2)) {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .wrapPage('EIP712', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.layer2)
          .messagePage(api.chain.symbol)
          .wrapPage('EIP712', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      }
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });

  it.each(TEST_COINS)('$name test sign message transaction', async ({ api }) => {
    for (const transaction of MESSAGE_TRANSACTION) {
      const client: EIP712MessageTransaction = {
        message: transaction.message,
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await api.signMessage(client);
      const expectedSignature = await wallet.signMessage(client.message);
      expect(signature).toEqual(expectedSignature);
      const txDetail = await getTxDetail(transport, props.appId);

      let expectedTxDetail: string;
      if (isEmpty(api.chain.layer2)) {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .wrapPage('MESSAGE', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.layer2)
          .messagePage(api.chain.symbol)
          .wrapPage('MESSAGE', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      }
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });

  it.each(TEST_COINS)('$name test sign eip1559 transaction', async ({ api }) => {
    for (const transaction of EIP1559_TRANSFER_TRANSACTION) {
      const client: EIP1559Transaction = {
        transaction: {
          ...transaction,
          value: utils.toHex(utils.toWei(transaction.value, 'ether')),
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await api.signEIP1559Transaction(client);
      const expectedSignature = await wallet.signEIP1559Transaction(client.transaction, api.chain.id);
      expect(signature).toEqual(expectedSignature);
      const txDetail = await getTxDetail(transport, props.appId);
      let expectedTxDetail: string;
      if (isEmpty(api.chain.layer2)) {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .addressPage(transaction.to.toLowerCase())
          .amountPage(+transaction.value)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.layer2)
          .messagePage(api.chain.symbol)
          .addressPage(transaction.to.toLowerCase())
          .amountPage(+transaction.value)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      }
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });

  it.each([coinCronos])('$name test sign eip1559 erc20 transaction', async ({ api }) => {
    for (const transaction of EIP1559_ERC20_TRANSACTION) {
      const token = api.chain.tokens?.USDT;
      const scale = 10 ** +token.unit;
      const tokenAmount = +transaction.amount;
      const amount = (tokenAmount * scale).toString(16);
      const erc20Data = `0xa9059cbb${transaction.to.slice(2).padStart(64, '0')}${amount.padStart(64, '0')}`;
      const client: EIP1559Transaction = {
        transaction: {
          ...transaction,
          to: token.contractAddress,
          data: erc20Data,
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await api.signEIP1559Transaction(client);
      const expectedSignature = await wallet.signEIP1559Transaction(client.transaction, api.chain.id);
      expect(signature).toEqual(expectedSignature);
      const txDetail = await getTxDetail(transport, props.appId);
      let expectedTxDetail: string;
      if (isEmpty(api.chain.layer2)) {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .messagePage('USDT')
          .addressPage(transaction.to.toLowerCase())
          .amountPage(+tokenAmount)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.layer2)
          .messagePage(api.chain.symbol)
          .messagePage('USDT')
          .addressPage(transaction.to.toLowerCase())
          .amountPage(+tokenAmount)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      }
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });

  it.each(TEST_COINS)('$name test sign eip1559 smart contract transaction', async ({ api }) => {
    for (const transaction of EIP1559_SMART_CONTRACT_TRANSACTION) {
      const client: EIP1559Transaction = {
        transaction: {
          ...transaction,
          value: utils.toHex(utils.toWei(transaction.value, 'ether')),
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await api.signEIP1559SmartContractTransaction(client);
      const expectedSignature = await wallet.signEIP1559Transaction(client.transaction, api.chain.id);
      expect(signature).toEqual(expectedSignature);
      const txDetail = await getTxDetail(transport, props.appId);
      let expectedTxDetail: string;
      if (isEmpty(api.chain.layer2)) {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .wrapPage('SMART', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.layer2)
          .messagePage(api.chain.symbol)
          .wrapPage('SMART', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      }
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });

  it.each(TEST_COINS)('$name test sign eip1559 smart contract segment transaction', async ({ api }) => {
    for (const transaction of EIP1559_SMART_CONTRACT_SEGMENT_TRANSACTION) {
      const client: EIP1559Transaction = {
        transaction: {
          ...transaction,
          value: utils.toHex(utils.toWei(transaction.value, 'ether')),
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await api.signEIP1559Transaction(client);
      const expectedSignature = await wallet.signEIP1559Transaction(client.transaction, api.chain.id);
      expect(signature).toEqual(expectedSignature);
      const txDetail = await getTxDetail(transport, props.appId);
      let expectedTxDetail: string;
      if (isEmpty(api.chain.layer2)) {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .wrapPage('SMART', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.layer2)
          .messagePage(api.chain.symbol)
          .wrapPage('SMART', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      }
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });
});
