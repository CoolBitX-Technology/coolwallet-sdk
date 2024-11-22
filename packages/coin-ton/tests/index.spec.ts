import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import TON from '../src';
import {
  SignTransferTokenTxType,
  SignTransferTxType,
  TransferTokenTransaction,
  TransferTransaction,
} from '../src/config/types';
import TonWeb from 'tonweb';
import { getJettonWallet, getKeyPair, getWalletV4R2 } from '../src/utils/tonweb';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test TON SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  const tonSDK = new TON();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
  });

  describe('Test Get Address', () => {
    it('index 0 with Non-bounceable', async () => {
      const address = await tonSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
      expect(address).toEqual('UQD87WwPU6bw4WJ9vQyfgnxHy6hWbJg0LQRcBxhi95WErCOQ');
    });
    it('index 0 with bounceable', async () => {
      const address = await tonSDK.getAddress(transport, props.appPrivateKey, props.appId, 0, true);
      expect(address).toEqual('EQD87WwPU6bw4WJ9vQyfgnxHy6hWbJg0LQRcBxhi95WErH5V');
    });
    it('index 16 with Non-bounceable', async () => {
      const address = await tonSDK.getAddress(transport, props.appPrivateKey, props.appId, 16);
      expect(address).toEqual('UQAOh0hSRHguolOxpU5jRa4ICdQVogFMeRivN5x3gHYMTPuS');
    });
  });

  describe('Test Sign Transfer', () => {
    async function get_signed_tx_by_coolwallet_sdk(transaction: TransferTransaction, addressIndex: number) {
      const signData: SignTransferTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex,
        transaction,
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      return await tonSDK.signTransaction(signData);
    }

    async function get_signed_tx_by_tonweb_sdk(transaction: TransferTransaction, addressIndex: number) {
      const { toAddress, amount, seqno, payload, expireAt, sendMode } = transaction;
      const { publicKey, secretKey } = await getKeyPair(mnemonic, addressIndex);

      return await getWalletV4R2(Buffer.from(publicKey).toString('hex'))
        .methods.transfer({
          secretKey: secretKey,
          toAddress: toAddress,
          amount,
          seqno,
          payload,
          expireAt,
          sendMode,
        })
        .getQuery()
        .then((message) => message.toBoc(false))
        .then(TonWeb.utils.bytesToBase64);
    }

    async function expect_both_coolwallet_and_tonweb_signed_tx_is_same(transaction: TransferTransaction) {
      const addressIndex = 0;

      const signedTx1 = await get_signed_tx_by_coolwallet_sdk(transaction, addressIndex);
      const signedTx2 = await get_signed_tx_by_tonweb_sdk(transaction, addressIndex);

      expect(signedTx1).toEqual(signedTx2);
    }

    it('transfer to bounceable address', async () => {
      await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '123000000',
        seqno: 20,
        payload: 'Hello CoolWallet!',
        expireAt: 1716886177,
        sendMode: 3,
      });
    });

    it('transfer to non-bounceable address', async () => {
      await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
        toAddress: 'UQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVNsM',
        amount: '123000000',
        seqno: 20,
        payload: 'Hello CoolWallet!',
        expireAt: 1716886177,
        sendMode: 3,
      });
    });

    it('transfer to hex address', async () => {
      await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
        toAddress: '0:16e502e4dd7bd6dc731b2ea904f705e42fd35d1a9135e79e6d53185d79af2954',
        amount: '123000000',
        seqno: 20,
        payload: 'Hello CoolWallet!',
        expireAt: 1716886177,
        sendMode: 3,
      });
    });

    it('transfer with amount 0 will throw error', async () => {
      const transaction = {
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '0',
        seqno: 20,
        expireAt: 1716886177,
        sendMode: 130,
      };

      const addressIndex = 0;

      expect(get_signed_tx_by_coolwallet_sdk(transaction, addressIndex)).rejects.toThrowError();
    });

    it('transfer with amount 1', async () => {
      await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '1',
        seqno: 20,
        expireAt: 1716886177,
        sendMode: 130,
      });
    });

    it('transfer with amount 99999999', async () => {
      await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '99999999',
        seqno: 20,
        expireAt: 1716886177,
        sendMode: 130,
      });
    });

    it('transfer with large amount will throw error', async () => {
      const transaction = {
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: TonWeb.utils.toNano('100000000').toString(), // Pro card not support to display 9 integer digits
        seqno: 20,
        expireAt: 1716886177,
        sendMode: 130,
      };

      const addressIndex = 0;

      expect(get_signed_tx_by_coolwallet_sdk(transaction, addressIndex)).rejects.toThrowError();
    });

    it('transfer with seqno 0', async () => {
      await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '123000000',
        seqno: 0,
        expireAt: 1716886177,
        sendMode: 130,
      });
    });

    it('transfer with seqno 100', async () => {
      await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '123000000',
        seqno: 100,
        expireAt: 1716886177,
        sendMode: 130,
      });
    });

    it('transfer with sendMode 3', async () => {
      await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '123000000',
        seqno: 100,
        expireAt: 1716886177,
        sendMode: 3,
      });
    });

    it('transfer with sendMode 130', async () => {
      await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '123000000',
        seqno: 100,
        expireAt: 1716886177,
        sendMode: 130,
      });
    });

    it('transfer without memo', async () => {
      await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '123000000',
        seqno: 100,
        expireAt: 1716886177,
        sendMode: 130,
        payload: '',
      });
    });

    it('transfer with memo', async () => {
      await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '123000000',
        seqno: 100,
        expireAt: 1716886177,
        sendMode: 130,
        payload: 'Hello Hello Hello Hello Hello Hello',
      });
    });

    it('transfer with large memo', async () => {
      const transaction = {
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '123000000',
        seqno: 20,
        expireAt: 1716886177,
        sendMode: 130,
        payload: 'Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello',
      };

      const addressIndex = 0;

      expect(get_signed_tx_by_coolwallet_sdk(transaction, addressIndex)).rejects.toThrowError();
    });

    it('transfer with chinese memo', async () => {
      await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '123000000',
        seqno: 100,
        expireAt: 1716886177,
        sendMode: 130,
        payload: '你好',
      });
    });
  });

  describe('Test Sign Transfer Token', () => {
    async function get_signed_tx_by_coolwallet_sdk(transaction: TransferTokenTransaction, addressIndex: number) {
      const signData: SignTransferTokenTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex,
        transaction,
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      return await tonSDK.signTransferTokenTransaction(signData);
    }

    async function get_signed_tx_by_tonweb_sdk(transaction: TransferTokenTransaction, addressIndex: number) {
      const { toAddress: fromTokenAccount, amount, seqno, payload, expireAt, sendMode } = transaction;
      const { jettonAmount, toAddress, forwardAmount, forwardPayload, responseAddress } = payload;
      const { publicKey, secretKey } = await getKeyPair(mnemonic, addressIndex);

      const wallet = getWalletV4R2(Buffer.from(publicKey).toString('hex'));

      const jettonWallet = await getJettonWallet(fromTokenAccount);

      const transferPayload = await jettonWallet.createTransferBody({
        jettonAmount,
        toAddress: new TonWeb.utils.Address(toAddress),
        forwardAmount,
        forwardPayload: new Uint8Array([...new Uint8Array(4), ...new TextEncoder().encode(forwardPayload || '')]),
        responseAddress: new TonWeb.utils.Address(responseAddress),
      } as any);

      return await wallet.methods
        .transfer({
          secretKey: secretKey,
          toAddress: fromTokenAccount,
          amount,
          seqno,
          expireAt,
          sendMode,
          payload: transferPayload,
        })
        .getQuery()
        .then((message) => message.toBoc(false))
        .then(TonWeb.utils.bytesToBase64);
    }

    async function expect_both_coolwallet_and_tonweb_signed_tx_is_same(transaction: TransferTokenTransaction) {
      const addressIndex = 0;

      const signedTx1 = await get_signed_tx_by_coolwallet_sdk(transaction, addressIndex);
      const signedTx2 = await get_signed_tx_by_tonweb_sdk(transaction, addressIndex);

      expect(signedTx1).toEqual(signedTx2);
    }

    const baseTransaction = {
      toAddress: 'EQBgGEdG_Uj-c1hcy2zBT6e7ADNpE2KBoXQTKAWSeeLBKHcu',
      amount: '50000000',
      seqno: 19,
      expireAt: 1716886177,
      sendMode: 3,
      payload: {
        jettonAmount: '1234',
        toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        forwardAmount: '1',
        forwardPayload: 'Hello',
        responseAddress: 'EQAlWnyf_OmGFyJ3wHkP930RGPDtokkcYhphAjId05OOI3Up',
      },
      tokenInfo: {
        symbol: 'USDT',
        decimals: 6,
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
      },
    };

    describe('By diffenent toAddress', () => {
      it("transfer: using sender's usdt account", async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          toAddress: 'EQBgGEdG_Uj-c1hcy2zBT6e7ADNpE2KBoXQTKAWSeeLBKHcu',
        });
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          toAddress: 'UQBgGEdG_Uj-c1hcy2zBT6e7ADNpE2KBoXQTKAWSeeLBKCrr',
        });
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          toAddress: 'EQAlWnyf_OmGFyJ3wHkP930RGPDtokkcYhphAjId05OOI3Up',
        });
      });

      it("transfer: using sender's coin account", async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          toAddress: 'EQAlWnyf_OmGFyJ3wHkP930RGPDtokkcYhphAjId05OOI3Up',
        });
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          toAddress: 'UQAlWnyf_OmGFyJ3wHkP930RGPDtokkcYhphAjId05OOIyjs',
        });
      });
    });

    describe('By diffenent amount', () => {
      it('transfer: using 0 TON will throw error', async () => {
        const transaction = { ...baseTransaction, amount: TonWeb.utils.toNano('0').toString() };
        const addressIndex = 0;
        expect(get_signed_tx_by_coolwallet_sdk(transaction, addressIndex)).rejects.toThrowError();
      });
      it('transfer: using 0.0000001 TON', async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          amount: TonWeb.utils.toNano('0.0000001').toString(),
        });
      });
      it('transfer: using 0.05 TON', async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          amount: TonWeb.utils.toNano('0.05').toString(),
        });
      });
      it('transfer: using 10000 TON', async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          amount: TonWeb.utils.toNano('10000').toString(),
        });
      });
    });

    describe('By diffenent seqno', () => {
      it('transfer: seqno is 0', async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          seqno: 0,
        });
      });
      it('transfer: seqno is 1', async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          seqno: 1,
        });
      });
      it('transfer: seqno is 100', async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          seqno: 100,
        });
      });
    });

    describe('By diffenent sendMode', () => {
      it('transfer: sendMode is 0', async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          sendMode: 0,
        });
      });
      it('transfer: sendMode is 3', async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          sendMode: 3,
        });
      });
      it('transfer: sendMode is 130', async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          sendMode: 130,
        });
      });
    });

    describe('By diffenent jettonAmount', () => {
      it('transfer: jettonAmount is 0 will throw error', async () => {
        const transaction = { ...baseTransaction, payload: { ...baseTransaction.payload, jettonAmount: '0' } };
        const addressIndex = 0;
        expect(get_signed_tx_by_coolwallet_sdk(transaction, addressIndex)).rejects.toThrowError();
      });
      it('transfer: jettonAmount is 1', async () => {
        const transaction = { ...baseTransaction, payload: { ...baseTransaction.payload, jettonAmount: '1' } };
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same(transaction);
      });
      it('transfer: jettonAmount is 1000000000000', async () => {
        const transaction = {
          ...baseTransaction,
          payload: { ...baseTransaction.payload, jettonAmount: '1000000000000' },
        };
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same(transaction);
      });
      it('transfer: jettonAmount is 100000000000000 will do blind transfer', async () => {
        const transaction = {
          ...baseTransaction,
          payload: { ...baseTransaction.payload, jettonAmount: '100000000000000' },
        };
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same(transaction);
      });
    });

    describe('By diffenent receiver', () => {
      it("transfer: using receiver's coin account (bounceable)", async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          payload: { ...baseTransaction.payload, toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ' },
        });
      });
      it("transfer: using receiver's coin account (non-bounceable)", async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          payload: { ...baseTransaction.payload, toAddress: 'UQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVNsM' },
        });
      });
      it("transfer: using receiver's coin account (hex)", async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          payload: {
            ...baseTransaction.payload,
            toAddress: '0:16e502e4dd7bd6dc731b2ea904f705e42fd35d1a9135e79e6d53185d79af2954',
          },
        });
      });
      it("transfer: using receiver's usdt account (bounceable)", async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          payload: { ...baseTransaction.payload, toAddress: 'EQCwDGN3dztkodIPeSLNWxB2eMAFUtqrMUhrfKV1BZ7g1hRA' },
        });
      });
      it("transfer: using receiver's usdt account (non-bounceable)", async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          payload: { ...baseTransaction.payload, toAddress: 'UQCwDGN3dztkodIPeSLNWxB2eMAFUtqrMUhrfKV1BZ7g1kmF' },
        });
      });
      it("transfer: using receiver's usdt account (hex)", async () => {
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same({
          ...baseTransaction,
          payload: {
            ...baseTransaction.payload,
            toAddress: '0:b00c6377773b64a1d20f7922cd5b107678c00552daab31486b7ca575059ee0d6',
          },
        });
      });
    });

    describe('By diffenent forwardAmount', () => {
      it('transfer: forwardAmount is 0 will throw error', async () => {
        const transaction = { ...baseTransaction, payload: { ...baseTransaction.payload, forwardAmount: '0' } };
        const addressIndex = 0;
        expect(get_signed_tx_by_coolwallet_sdk(transaction, addressIndex)).rejects.toThrowError();
      });
      it('transfer: forwardAmount is 1', async () => {
        const transaction = { ...baseTransaction, payload: { ...baseTransaction.payload, forwardAmount: '1' } };
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same(transaction);
      });
      it('transfer: forwardAmount is 10000000', async () => {
        const transaction = { ...baseTransaction, payload: { ...baseTransaction.payload, forwardAmount: '10000000' } };
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same(transaction);
      });
      it('transfer: forwardAmount is 10000000000000000', async () => {
        const transaction = {
          ...baseTransaction,
          payload: { ...baseTransaction.payload, forwardAmount: '10000000000000000' },
        };
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same(transaction);
      });
    });

    describe('By diffenent memo', () => {
      it('transfer: without memo', async () => {
        const transaction = {
          ...baseTransaction,
          payload: { ...baseTransaction.payload, forwardPayload: '' },
        };
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same(transaction);
      });
      it('transfer: with short memo', async () => {
        const transaction = {
          ...baseTransaction,
          payload: { ...baseTransaction.payload, forwardPayload: 'Hello Hello Hello Hello Hello Hello' },
        };
        await expect_both_coolwallet_and_tonweb_signed_tx_is_same(transaction);
      });
      it('transfer: with long memo', async () => {
        const transaction = {
          ...baseTransaction,
          payload: {
            ...baseTransaction.payload,
            forwardPayload: 'Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello',
          },
        };
        const addressIndex = 0;
        await expect(get_signed_tx_by_coolwallet_sdk(transaction, addressIndex)).rejects.toThrowError();
      });
    });
  });
});
