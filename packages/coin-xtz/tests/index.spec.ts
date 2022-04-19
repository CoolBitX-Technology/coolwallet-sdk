import { Transport } from '@coolwallet/core';
import { initialize, getTxDetail, DisplayBuilder, CURVE, HDWallet } from '@coolwallet/testing-library';
import * as bip39 from 'bip39';
import { createTransport } from '@coolwallet/transport-jre-http';
import XTZ from '../src';
import * as codecUtil from '../src/utils/codecUtil';
import type {
  xtzTransaction,
  xtzReveal,
  xtzDelegation
} from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

describe('Test XTZ SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  const xtz = new XTZ();
  const wallet = new HDWallet(CURVE.ED25519);

  beforeAll(async () => {
    const mnemonic = bip39.generateMnemonic();
    console.log('mnemonic :', mnemonic);
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
    await wallet.setMnemonic(mnemonic);
  });

  it('$name: test get address 0', async () => {
    const addressIndex = 0;

    // address from coolwallet
    const address = await xtz.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);

    // expected address
    const publicKey = await wallet.derivePath(`m/44'/1729'/${addressIndex}'/0'`).getPublicKey();
    const expectedAddress = codecUtil.pubKeyToAddress(publicKey?.toString('hex') ?? '');
    console.log('expectedAddress :', expectedAddress);

    expect(address.toLowerCase()).toEqual(expectedAddress.toLowerCase());
  });

  // it('$name test sign transaction', async () => {
  //   for (const transaction of TRANSFER_TRANSACTION) {
  //     const client: LegacyTransaction = {
  //       transaction: {
  //         ...transaction,
  //         value: utils.toHex(utils.toWei(transaction.value, 'ether')),
  //       },
  //       transport,
  //       appPrivateKey: props.appPrivateKey,
  //       appId: props.appId,
  //       addressIndex: 0,
  //     };

  //     const signature = await api.signTransaction(client);
  //     const expectedSignature = await wallet.signTransaction(client.transaction, api.chain.id);
  //     expect(signature).toEqual(expectedSignature);
  //     const txDetail = await getTxDetail(transport, props.appId);
  //     const expectedTxDetail = new DisplayBuilder()
  //       .messagePage('TEST')
  //       .messagePage(api.chain.symbol)
  //       .addressPage(transaction.to)
  //       .amountPage(+transaction.value)
  //       .wrapPage('PRESS', 'BUTToN')
  //       .finalize();
  //     expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  //   }
  // });
});

