/* eslint-disable max-len */
import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';

import ICX from '../src';

type PromiseValue<T> = T extends Promise<infer P> ? P : never;

describe('Test ICX SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let cardType: CardType;
  const icx = new ICX();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

  beforeAll(async () => {
    if (process.env.CARD === 'go') {
      cardType = CardType.Go;
    } else {
      cardType = CardType.Pro;
    }
    if (cardType === CardType.Go) {
      transport = (await createTransport('http://localhost:9527', CardType.Go))!;
    } else {
      transport = (await createTransport())!;
    }
    props = await initialize(transport, mnemonic);
  });

  it(`get address`, async () => {
    const address = await icx.getAddress(transport, props.appPrivateKey, props.appId, 0);
    expect(address).toMatchInlineSnapshot(`"hx70c8b1428461fe3c9e9fdd85cc2b15d15193d64b"`);
  });

  it('sign tx', async () => {
    const param =
      '{"to":"hxcaaa77cce63e18d1f32208a23e8365605cb314bc","from":"hx70c8b1428461fe3c9e9fdd85cc2b15d15193d64b","stepLimit":"0x186a0","nid":"0x1","version":"0x3","timestamp":"0x62cb64fbceb38","value":"0x1313d92c1a9f32c400"}';
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: param as any,
      addressIndex: 0,
    };
    const signedTx = await icx.signTransaction(signTxData);
    expect(signedTx);
  });

  it('sign tx: from address starts with 0', async () => {
    const param =
      '{"to":"hxcaaa77cce63e18d1f32208a23e8365605cb314bc","from":"hx0253c17a665cec63c5c7778fac5c83dc6358da27","stepLimit":"0x186a0","nid":"0x1","version":"0x3","timestamp":"0x62cb64fbceb38","value":"0x1313d92c1a9f32c400"}';
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: param as any,
      addressIndex: 0,
    };
    const signedTx = await icx.signTransaction(signTxData);
    expect(signedTx).toMatchInlineSnapshot(`
      Object {
        "from": "hx0253c17a665cec63c5c7778fac5c83dc6358da27",
        "nid": "0x1",
        "signature": "DVA0S590DoYlb7ELjynC7YYhBuhPd2wsvcT6rkVsv5F7won3lOmPhOJylPwrXrUa7p/Ztrva9vSv/PJ8gKXh+AA=",
        "stepLimit": "0x186a0",
        "timestamp": "0x62cb64fbceb38",
        "to": "hxcaaa77cce63e18d1f32208a23e8365605cb314bc",
        "value": "0x1313d92c1a9f32c400",
        "version": "0x3",
      }
    `);
  });
});
