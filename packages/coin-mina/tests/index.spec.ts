import { Transport } from '@coolwallet/core';
import { initialize, getTxDetail, DisplayBuilder } from '@coolwallet/testing-library';
import * as bip39 from 'bip39';
import { createTransport } from '@coolwallet/transport-jre-http';
import MINA from '../src';

type PromiseValue<U> = U extends Promise<infer P> ? P : never;

describe('Test Polygon sdk', () => {
  // let props: PromiseValue<ReturnType<typeof initialize>>;
  // let transport: Transport;
  // const mina = new MINA();

  // beforeAll(async () => {
  //   const mnemonic = bip39.generateMnemonic();
  //   transport = (await createTransport())!;
  //   props = await initialize(transport, mnemonic);
  // });

  it('Mina: test sign typed data transaction', () => {


    const txDetail = "";
    const expectedTxDetail = "";

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });
});
