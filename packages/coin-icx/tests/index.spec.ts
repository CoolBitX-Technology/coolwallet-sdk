import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';

import ICX from '../src';

type PromiseValue<T> = T extends Promise<infer P> ? P : never;

describe('Test ICX SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  const icx = new ICX();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    transport = (await createTransport())!;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    props = await initialize(transport, mnemonic);
  });

  it(`get address`, async () => {
    const address = await icx.getAddress(transport, props.appPrivateKey, props.appId, 0);
    expect(address).toMatchInlineSnapshot(`"hx70c8b1428461fe3c9e9fdd85cc2b15d15193d64b"`);
  });

  it('icx tx', async () => {
    const param =
      '{"to":"hxcaaa77cce63e18d1f32208a23e8365605cb314bc","from":"hx70c8b1428461fe3c9e9fdd85cc2b15d15193d64b","stepLimit":"0x186a0","nid":"0x1","version":"0x3","timestamp":"0x62cb64fbceb38","value":"0x1313d92c1a9f32c400"}';
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: param,
      addressIndex: 0,
      confirmCB: () => {},
      authorizedCB: () => {},
    };
    const signedTx = await icx.signTransaction(signTxData);
  });
});
