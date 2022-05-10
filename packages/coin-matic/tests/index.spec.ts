import { Transport } from '@coolwallet/core';
import { initialize, getTxDetail, DisplayBuilder } from '@coolwallet/testing-library';
import * as bip39 from 'bip39';
import { createTransport } from '@coolwallet/transport-jre-http';
import { TYPED_DATA_FIXTURE_0, TYPED_DATA_FIXTURE_1 } from './fixtures/typedData';
import Wallet from './utils/wallet';
import POLYGON from '../src';

type PromiseValue<U> = U extends Promise<infer P> ? P : never;

describe('Test Polygon sdk', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  const wallet = new Wallet();
  const coinPolygon = new POLYGON();

  beforeAll(async () => {
    const mnemonic = bip39.generateMnemonic();
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
    await wallet.setMnemonic(mnemonic);
  });

  it('Polygon: test sign typed data transaction', async () => {
    const client = {
      typedData: TYPED_DATA_FIXTURE_0(137),
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
    };

    const signature = await coinPolygon.signTypedData(client);
    const expectedSignature = await wallet.signTypedData(client.typedData);
    expect(signature).toEqual(expectedSignature);
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('MATIC')
      .wrapPage('EIP712', '')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Polygon: test sign typed data transaction', async () => {
    const client = {
      typedData: TYPED_DATA_FIXTURE_1(137),
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
    };

    const signature = await coinPolygon.signTypedData(client);
    const expectedSignature = await wallet.signTypedData(client.typedData);
    expect(signature).toEqual(expectedSignature);
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('MATIC')
      .wrapPage('EIP712', '')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });
});
