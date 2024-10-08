import { Transport } from '@coolwallet/core';
import { initialize, getTxDetail, DisplayBuilder } from '@coolwallet/testing-library';
import * as bip39 from 'bip39';
import isEmpty from 'lodash/isEmpty';
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
  STAKING_TRANSACTION,
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

const coinCronos = { name: 'Cronos', api: new EVM(CHAIN.CRONOS.id) };
const coinPolygon = { name: 'Polygon', api: new EVM(CHAIN.POLYGON.id) };
const coinAvaxC = { name: 'Avax C', api: new EVM(CHAIN.AVAXC.id) };
const coinCelo = { name: 'Celo', api: new EVM(CHAIN.CELO.id) };
const coinFantom = { name: 'Fantom', api: new EVM(CHAIN.FANTOM.id) };
const coinFlare = { name: 'Flare', api: new EVM(CHAIN.FLARE.id) };
const coinOKX = { name: 'OKX', api: new EVM(CHAIN.OKX.id) };
// Layer 2
const coinArbitrum = { name: 'Arbitrum', api: new EVM(CHAIN.ARBITRUM.id) };
const coinOptimism = { name: 'Optimism', api: new EVM(CHAIN.OPTIMISM.id) };
const coinZkSync = { name: 'zkSync', api: new EVM(CHAIN.ZKSYNC.id) };
const coinBase = { name: 'Base', api: new EVM(CHAIN.BASE.id) };

const TEST_COINS = [
  coinCronos,
  coinPolygon,
  coinAvaxC,
  coinArbitrum,
  coinOptimism,
  coinCelo,
  coinFantom,
  coinFlare,
  coinOKX,
  coinZkSync,
  coinBase,
];

describe('Test EVM SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  const wallet = new Wallet();

  beforeAll(async () => {
    const mnemonic = bip39.generateMnemonic();
    transport = (await createTransport())!;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    props = await initialize(transport, mnemonic);
    await wallet.setMnemonic(mnemonic);
  });

  describe.each(TEST_COINS)('Test EVM $name SDK', ({ api }) => {
    beforeEach(() => {
      wallet.coinType = api.coinType;
    });

    it('Get address 0', async () => {
      const address = await api.getAddress(transport, props.appPrivateKey, props.appId, 0);
      const expectedAddress = await wallet.getAddress(0);
      expect(address.toLowerCase()).toEqual(expectedAddress.toLowerCase());
    });

    it('Get address 0 from account key', async () => {
      const accExtKey = await wallet.getAccountAddress();
      const address = await api.getAddressByAccountKey(accExtKey.publicKey, accExtKey.chainCode, 0);
      const expectedAddress = await wallet.getAddress(0);
      expect(address.toLowerCase()).toEqual(expectedAddress.toLowerCase());
    });

    it.each(TRANSFER_TRANSACTION)('Send transaction to $to', async (transaction) => {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
    });

    describe.each(ERC20_TRANSACTION)('send erc20 token to $to', (transaction) => {
      if (isEmpty(api.chain.tokens)) return;
      it.each(Object.values(api.chain.tokens))('$symbol token:', async (token) => {
        const hasCommercialAt = isEmpty(token.signature);
        const scale = 10 ** +token.unit;
        const tokenAmount = +transaction.amount;
        const amount = Math.floor(tokenAmount * scale).toString(16);
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const txDetail = await getTxDetail(transport, props.appId);
        const tokenSymbol = (hasCommercialAt ? '@' : '') + token.symbol;
        let expectedTxDetail;
        if (isEmpty(api.chain.layer2)) {
          expectedTxDetail = new DisplayBuilder()
            .messagePage('TEST')
            .messagePage(api.chain.symbol)
            .messagePage(tokenSymbol)
            .addressPage(transaction.to.toLowerCase())
            .amountPage(+tokenAmount)
            .wrapPage('PRESS', 'BUTToN')
            .finalize();
        } else {
          expectedTxDetail = new DisplayBuilder()
            .messagePage('TEST')
            .messagePage(api.chain.layer2)
            .messagePage(api.chain.symbol)
            .messagePage(tokenSymbol)
            .addressPage(transaction.to.toLowerCase())
            .amountPage(+tokenAmount)
            .wrapPage('PRESS', 'BUTToN')
            .finalize();
        }

        try {
          expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
        } catch (e) {
          console.error('send erc20 token to ', token);
          throw e;
        }
      });

      it('Unofficial token', async () => {
        const unofficialToken = {
          name: 'Tether USD',
          symbol: 'USDT',
          unit: '6',
          contractAddress: '0xffffffffffffffffffffffffffffffffffffffff',
          signature: ``,
        };

        const hasCommercialAt = isEmpty(unofficialToken.signature);
        const scale = 10 ** +unofficialToken.unit;
        const tokenAmount = +transaction.amount;
        const amount = Math.floor(tokenAmount * scale).toString(16);
        const erc20Data = `0xa9059cbb${transaction.to.slice(2).padStart(64, '0')}${amount.padStart(64, '0')}`;
        const client: LegacyTransaction = {
          transaction: {
            ...transaction,
            to: unofficialToken.contractAddress,
            data: erc20Data,
            option: {
              info: {
                symbol: unofficialToken.symbol,
                decimals: unofficialToken.unit,
              },
            },
          },
          transport,
          appPrivateKey: props.appPrivateKey,
          appId: props.appId,
          addressIndex: 0,
        };
        const signature = await api.signTransaction(client);
        const expectedSignature = await wallet.signTransaction(client.transaction, api.chain.id);
        expect(signature).toEqual(expectedSignature);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const txDetail = await getTxDetail(transport, props.appId);
        const tokenSymbol = (hasCommercialAt ? '@' : '') + unofficialToken.symbol;
        let expectedTxDetail;
        if (isEmpty(api.chain.layer2)) {
          expectedTxDetail = new DisplayBuilder()
            .messagePage('TEST')
            .messagePage(api.chain.symbol)
            .messagePage(tokenSymbol)
            .addressPage(transaction.to.toLowerCase())
            .amountPage(+tokenAmount)
            .wrapPage('PRESS', 'BUTToN')
            .finalize();
        } else {
          expectedTxDetail = new DisplayBuilder()
            .messagePage('TEST')
            .messagePage(api.chain.layer2)
            .messagePage(api.chain.symbol)
            .messagePage(tokenSymbol)
            .addressPage(transaction.to.toLowerCase())
            .amountPage(+tokenAmount)
            .wrapPage('PRESS', 'BUTToN')
            .finalize();
        }

        expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
      });
    });

    it.each(SMART_CONTRACT_TRANSACTION)('Send smart contract transaction to $to', async (transaction) => {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
    });

    it.each(SMART_CONTRACT_SEGMENT_TRANSACTION)(
      'Send smart contract segment transaction to $to',
      async (transaction) => {
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
    );

    it.each(TYPED_DATA_TRANSACTION)('Send transaction to $to', async (transaction) => {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
    });

    it.each(MESSAGE_TRANSACTION)('Send message transaction to $to', async (transaction) => {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
    });

    it.each(EIP1559_TRANSFER_TRANSACTION)('Send eip1559 transaction to $to', async (transaction) => {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
    });

    describe.each(EIP1559_ERC20_TRANSACTION)('Send eip1559 erc20 transaction to $to', (transaction) => {
      if (isEmpty(api.chain.tokens)) return;
      it.each(Object.values(api.chain.tokens))('$symbol token:', async (token) => {
        const hasCommercialAt = isEmpty(token.signature);
        const decimals = Math.pow(10, +token.unit);
        const tokenAmount = +transaction.amount;
        const amount = Math.floor(decimals * tokenAmount).toString(16);
        console.log(amount);
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const txDetail = await getTxDetail(transport, props.appId);
        const tokenSymbol = (hasCommercialAt ? '@' : '') + token.symbol;
        let expectedTxDetail: string;
        if (isEmpty(api.chain.layer2)) {
          expectedTxDetail = new DisplayBuilder()
            .messagePage('TEST')
            .messagePage(api.chain.symbol)
            .messagePage(tokenSymbol)
            .addressPage(transaction.to.toLowerCase())
            .amountPage(+tokenAmount)
            .wrapPage('PRESS', 'BUTToN')
            .finalize();
        } else {
          expectedTxDetail = new DisplayBuilder()
            .messagePage('TEST')
            .messagePage(api.chain.layer2)
            .messagePage(api.chain.symbol)
            .messagePage(tokenSymbol)
            .addressPage(transaction.to.toLowerCase())
            .amountPage(+tokenAmount)
            .wrapPage('PRESS', 'BUTToN')
            .finalize();
        }

        expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
      });
    });

    it.each(EIP1559_SMART_CONTRACT_TRANSACTION)('Send eip1559 smart transaction to $to', async (transaction) => {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
    });

    it.each(EIP1559_SMART_CONTRACT_SEGMENT_TRANSACTION)(
      'Send eip1559 smart contract segment transaction to $to',
      async (transaction) => {
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
    );
  });

  describe.each([coinFantom])('Test $name Staking Transaction', ({ api }) => {
    it.each(STAKING_TRANSACTION)('Send staking transaction to $to', async (transaction) => {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const txDetail = await getTxDetail(transport, props.appId);

      const validatorId = parseInt(transaction.data.slice(10, 74), 16);
      const validatorDisplay = 'ID ' + validatorId;

      let expectedTxDetail = '';
      const programId = transaction.data.slice(0, 10);
      if (programId.toLowerCase() === api.chain.stakingInfo.delegate) {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .wrapPage('Delgt', '')
          .messagePage(validatorDisplay)
          .amountPage(+transaction.value)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else if (programId.toLowerCase() === api.chain.stakingInfo.withdraw) {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .wrapPage('Withdr', '')
          .messagePage(validatorDisplay)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else if (programId.toLowerCase() === api.chain.stakingInfo.undelegate) {
        const parsedVal = parseInt(transaction.data.slice(138, 202), 16);
        const scale = 10 ** -18;
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .wrapPage('Undelgt', '')
          .messagePage(validatorDisplay)
          .amountPage(+(parsedVal * scale))
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      } else {
        expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(api.chain.symbol)
          .wrapPage('SMART', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
      }

      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    });
  });
});
