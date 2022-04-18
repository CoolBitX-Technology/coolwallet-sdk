import { Transport } from '@coolwallet/core';
import { initialize, getTxDetail, DisplayBuilder } from '@coolwallet/testing-library';
import * as bip39 from 'bip39';
import { createTransport } from '@coolwallet/transport-jre-http';
import XTZ from '../src';
import type {
  xtzTransaction,
  xtzReveal,
  xtzDelegation
} from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const xtz = new XTZ();

describe('Test XTZ SDK', () => {
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
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage(api.chain.symbol)
        .addressPage(transaction.to)
        .amountPage(+transaction.value)
        .wrapPage('PRESS', 'BUTToN')
        .finalize();
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });
});

