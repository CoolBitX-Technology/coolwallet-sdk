import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, DisplayBuilder, getTxDetail } from '@coolwallet/testing-library';

import * as bip39 from 'bip39';

import ZEN from '../src';

type PromiseValue<T> = T extends Promise<infer P> ? P : never;

describe('Test ZEN SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  const zen = new ZEN();
  const mnemonic = bip39.generateMnemonic();

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    transport = (await createTransport())!;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    props = await initialize(transport, mnemonic);
  });

  it('zen tx', async () => {
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      scriptType: zen.ScriptType.P2PKH,
      inputs,
      output,
      change,
      confirmCB: () => {},
      authorizedCB: () => {},
    };
    const signedTx = await zen.signTransaction(signTxData);
  });
});
