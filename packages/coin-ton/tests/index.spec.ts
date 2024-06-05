import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import TON from '../src';
import { SignTransferTxType, TransferTxType } from '../src/config/types';
import TonWeb from 'tonweb';
import { getKeyPair, getWalletV4R2 } from '../src/utils/tonweb';

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

  describe('Test Sign Transaction', () => {
    async function get_signed_tx_by_coolwallet_sdk(transaction: TransferTxType, addressIndex: number) {
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

    async function get_signed_tx_by_tonweb_sdk(transaction: TransferTxType, addressIndex: number) {
      const { receiver, amount, seqno, payload, expireAt, sendMode } = transaction;
      const { publicKey, secretKey } = await getKeyPair(mnemonic, addressIndex);

      return await getWalletV4R2(Buffer.from(publicKey).toString('hex'))
        .methods.transfer({
          secretKey: secretKey,
          toAddress: receiver,
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

    async function expect_both_coolwallet_and_tonweb_signed_tx_is_same(
      transaction: TransferTxType,
      addressIndex: number
    ) {
      const signedTx1 = await get_signed_tx_by_coolwallet_sdk(transaction, addressIndex);
      const signedTx2 = await get_signed_tx_by_tonweb_sdk(transaction, addressIndex);

      expect(signedTx1).toEqual(signedTx2);
    }

    it('transfer with memo', async () => {
      const transaction: TransferTxType = {
        receiver: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '123000000',
        seqno: 20,
        payload: 'Hello CoolWallet!',
        expireAt: 1716886177,
      };

      const addressIndex = 0;

      await expect_both_coolwallet_and_tonweb_signed_tx_is_same(transaction, addressIndex);
    });

    it('transfer with sendMode 130', async () => {
      const transaction: TransferTxType = {
        receiver: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
        amount: '123000000',
        seqno: 20,
        expireAt: 1716886177,
        sendMode: 130,
      };

      const addressIndex = 0;

      await expect_both_coolwallet_and_tonweb_signed_tx_is_same(transaction, addressIndex);
    });
  });
});
