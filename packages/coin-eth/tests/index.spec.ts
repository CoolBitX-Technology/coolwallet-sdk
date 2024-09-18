import { CardType, Transport } from '@coolwallet/core';
import { initialize, getTxDetail, DisplayBuilder } from '@coolwallet/testing-library';
import * as bip39 from 'bip39';
import isEmpty from 'lodash/isEmpty';
import { createTransport } from '@coolwallet/transport-jre-http';
import * as utils from 'web3-utils';
import Wallet from './utils/wallet';
import ETH, { TOKENTYPE } from '../src';
import * as Fixtures from './fixtures/transactions';
import { signTx } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const CHAIN_ID = 1;

describe('Test ETH SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let cardType: CardType;
  const wallet = new Wallet();
  const eth = new ETH();
  const mnemonic = bip39.generateMnemonic();

  beforeAll(async () => {
    if (process.env.CARD === 'lite') {
      cardType = CardType.Lite;
    } else {
      cardType = CardType.Pro;
    }
    if (cardType === CardType.Lite) {
      transport = (await createTransport('http://localhost:9527', CardType.Lite))!;
    } else {
      transport = (await createTransport())!;
    }
    props = await initialize(transport, mnemonic);
    await wallet.setMnemonic(mnemonic);
  });

  it('ETH test get address 0', async () => {
    const address = await eth.getAddress(transport, props.appPrivateKey, props.appId, 0);
    const expectedAddress = await wallet.getAddress(0);
    expect(address.toLowerCase()).toEqual(expectedAddress.toLowerCase());
  });

  it.each(Fixtures.TRANSFER_TRANSACTION)('ETH test sign transaction', async (transaction) => {
    const client = {
      transaction: {
        ...transaction,
        chainId: CHAIN_ID,
        value: utils.toHex(utils.toWei(transaction.value, 'ether')),
        option: {
          info: {
            symbol: '',
            decimals: '',
          },
        },
      },
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
    };

    const signature = await eth.signTransaction(client);
    const expectedSignature = await wallet.signTransaction(client.transaction, CHAIN_ID);
    expect(signature).toEqual(expectedSignature);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('ETH')
      .addressPage(transaction.to.toLowerCase())
      .amountPage(+transaction.value)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  describe.each(Fixtures.ERC20_TRANSACTION)('ETH test sign erc20 transactions $to', (transaction) => {
    it.each(TOKENTYPE)('$symbol token', async (token) => {
      const scale = 10 ** +token.unit;
      const tokenAmount = +transaction.amount;
      const amount = Math.floor(tokenAmount * scale).toString(16);
      const erc20Data = `0xa9059cbb${transaction.to.slice(2).padStart(64, '0')}${amount.padStart(64, '0')}`;
      const client = {
        transaction: {
          ...transaction,
          to: token.contractAddress,
          chainId: CHAIN_ID,
          data: erc20Data,
          option: {
            info: {
              symbol: token.symbol,
              decimals: token.unit,
            },
          },
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };
      const signature = await eth.signTransaction(client);
      const expectedSignature = await wallet.signTransaction(client.transaction, CHAIN_ID);
      expect(signature).toEqual(expectedSignature);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const txDetail = await getTxDetail(transport, props.appId);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage('ETH')
        .messagePage(token.symbol.substring(0, 7))
        .addressPage(transaction.to.toLowerCase())
        .amountPage(+tokenAmount)
        .wrapPage('PRESS', 'BUTToN')
        .finalize();

      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    });

    it('Unofficial token', async () => {
      const unofficialToken = {
        name: 'Tether USD',
        symbol: 'USDTUDSU',
        unit: '6',
        contractAddress: '0xffffffffffffffffffffffffffffffffffffffff',
        signature: ``,
      };

      const hasCommercialAt = isEmpty(unofficialToken.signature);
      const scale = 10 ** +unofficialToken.unit;
      const tokenAmount = +transaction.amount;
      const amount = Math.floor(tokenAmount * scale).toString(16);
      const erc20Data = `0xa9059cbb${transaction.to.slice(2).padStart(64, '0')}${amount.padStart(64, '0')}`;
      const client: signTx = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        transaction: {
          chainId: CHAIN_ID,
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
        addressIndex: 0,
      };
      const signature = await eth.signTransaction(client);
      const expectedSignature = await wallet.signTransaction(client.transaction, CHAIN_ID);
      expect(signature).toEqual(expectedSignature);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const txDetail = await getTxDetail(transport, props.appId);
      const tokenSymbol = hasCommercialAt
        ? ('@' + unofficialToken.symbol).substring(0, 8)
        : unofficialToken.symbol.substring(0, 7);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage('ETH')
        .messagePage(tokenSymbol)
        .addressPage(transaction.to.toLowerCase())
        .amountPage(+tokenAmount)
        .wrapPage('PRESS', 'BUTToN')
        .finalize();

      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    });
  });

  it.each(Fixtures.SMART_CONTRACT_TRANSACTION)(
    'ETH test sign smart contract transaction $data',
    async (transaction) => {
      const client = {
        transaction: {
          ...transaction,
          chainId: CHAIN_ID,
          value: utils.toHex(utils.toWei(transaction.value, 'ether')),
          option: {
            info: {
              symbol: '',
              decimals: '',
            },
          },
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await eth.signTransaction(client);
      const expectedSignature = await wallet.signTransaction(client.transaction, CHAIN_ID);
      expect(signature).toEqual(expectedSignature);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const txDetail = await getTxDetail(transport, props.appId);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage('ETH')
        .wrapPage('SMART', '')
        .wrapPage('PRESS', 'BUTToN')
        .finalize();

      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  );

  it.each(Fixtures.SMART_CONTRACT_SEGMENT_TRANSACTION)(
    'ETH test sign smart contract segment transaction',
    async (transaction) => {
      const client = {
        transaction: {
          ...transaction,
          chainId: CHAIN_ID,
          value: utils.toHex(utils.toWei(transaction.value, 'ether')),
          option: {
            info: {
              symbol: '',
              decimals: '',
            },
          },
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await eth.signTransaction(client);
      const expectedSignature = await wallet.signTransaction(client.transaction, CHAIN_ID);
      expect(signature).toEqual(expectedSignature);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const txDetail = await getTxDetail(transport, props.appId);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage('ETH')
        .wrapPage('SMART', '')
        .wrapPage('PRESS', 'BUTToN')
        .finalize();

      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  );

  it.each(Fixtures.TYPED_DATA_TRANSACTION)('ETH test sign typed data transaction', async (typedData) => {
    console.log(mnemonic);
    const client = {
      typedData,
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
    };

    const signature = await eth.signTypedData(client);
    const expectedSignature = await wallet.signTypedData(typedData);
    expect(signature).toEqual(expectedSignature);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('ETH')
      .wrapPage('EIP712', '')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it.each(Fixtures.MESSAGE_TRANSACTION)('ETH test sign message transaction', async (message) => {
    const client = {
      message,
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
    };

    const signature = await eth.signMessage(client);
    const expectedSignature = await wallet.signMessage(message);
    expect(signature).toEqual(expectedSignature);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('ETH')
      .wrapPage('MESSAGE', '')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it.each(Fixtures.EIP1559_TRANSFER_TRANSACTION)('ETH test sign eip1559 transaction', async (transaction) => {
    const client = {
      transaction: {
        ...transaction,
        chainId: CHAIN_ID,
        value: utils.toHex(utils.toWei(transaction.value, 'ether')),
        option: {
          info: {
            symbol: '',
            decimals: '',
          },
        },
      },
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
    };

    const signature = await eth.signEIP1559Transaction(client);
    const expectedSignature = await wallet.signEIP1559Transaction(client.transaction, CHAIN_ID);
    expect(signature).toEqual(expectedSignature);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('ETH')
      .addressPage(transaction.to.toLowerCase())
      .amountPage(+transaction.value)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  describe.each(Fixtures.EIP1559_ERC20_TRANSACTION)('ETH test sign eip1559 erc20 transactions $to', (transaction) => {
    it.each(TOKENTYPE)('$symbol token', async (token) => {
      const scale = 10 ** +token.unit;
      const tokenAmount = +transaction.amount;
      const amount = Math.floor(tokenAmount * scale).toString(16);
      const erc20Data = `0xa9059cbb${transaction.to.slice(2).padStart(64, '0')}${amount.padStart(64, '0')}`;
      const client = {
        transaction: {
          ...transaction,
          to: token.contractAddress,
          chainId: CHAIN_ID,
          data: erc20Data,
          option: {
            info: {
              symbol: token.symbol,
              decimals: token.unit,
            },
          },
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };
      const signature = await eth.signEIP1559Transaction(client);
      const expectedSignature = await wallet.signEIP1559Transaction(client.transaction, CHAIN_ID);
      expect(signature).toEqual(expectedSignature);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const txDetail = await getTxDetail(transport, props.appId);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage('ETH')
        .messagePage(token.symbol)
        .addressPage(transaction.to.toLowerCase())
        .amountPage(+tokenAmount)
        .wrapPage('PRESS', 'BUTToN')
        .finalize();

      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    });
  });

  it.each(Fixtures.EIP1559_SMART_CONTRACT_TRANSACTION)(
    'ETH test sign eip1559 smart contract transaction $data',
    async (transaction) => {
      const client = {
        transaction: {
          ...transaction,
          chainId: CHAIN_ID,
          value: utils.toHex(utils.toWei(transaction.value, 'ether')),
          option: {
            info: {
              symbol: '',
              decimals: '',
            },
          },
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await eth.signEIP1559Transaction(client);
      const expectedSignature = await wallet.signEIP1559Transaction(client.transaction, CHAIN_ID);
      expect(signature).toEqual(expectedSignature);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const txDetail = await getTxDetail(transport, props.appId);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage('ETH')
        .wrapPage('SMART', '')
        .wrapPage('PRESS', 'BUTToN')
        .finalize();

      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  );

  it.each(Fixtures.EIP1559_SMART_CONTRACT_SEGMENT_TRANSACTION)(
    'ETH test sign eip1559 smart contract segment transaction',
    async (transaction) => {
      const client = {
        transaction: {
          ...transaction,
          chainId: CHAIN_ID,
          value: utils.toHex(utils.toWei(transaction.value, 'ether')),
          option: {
            info: {
              symbol: '',
              decimals: '',
            },
          },
        },
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
      };

      const signature = await eth.signEIP1559Transaction(client);
      const expectedSignature = await wallet.signEIP1559Transaction(client.transaction, CHAIN_ID);
      expect(signature).toEqual(expectedSignature);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const txDetail = await getTxDetail(transport, props.appId);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage('ETH')
        .wrapPage('SMART', '')
        .wrapPage('PRESS', 'BUTToN')
        .finalize();

      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  );
});
