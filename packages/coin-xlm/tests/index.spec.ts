import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import * as types from '../src/config/types';
import XLM from '../src';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test XLM SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const xlmSDK = new XLM(types.COIN_SPECIES.XLM);
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

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
  });

  it('Test Get index 0 address', async () => {
    const address = await xlmSDK.getAddress(transport, props.appPrivateKey, props.appId, types.PROTOCOL.BIP44);
    expect(address).toMatchInlineSnapshot(`"GAMHFD24LF6LASLUPBFTVTDNFBZAPFOWSUXDQ6F5MW6S6UCDCBY2JAWY"`);
  });

  it('Test Get index 1 address', async () => {
    const address = await xlmSDK.getAddress(transport, props.appPrivateKey, props.appId, types.PROTOCOL.SLIP0010);
    expect(address).toMatchInlineSnapshot(`"GD6Q5TIZH6JUZ4MM5ULAB6GWRADEALONNSGMZRIGSDAHYXNJ2INWOP3F"`);
  });

  it('Test Sign Transfer XLM Transaction for protocol SLIP0010', async () => {
    const transaction: types.signTxType = {
      transport: transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        from: '3a30655dcbf097ff5ccc3f6bb6a809cda73589c2b9d826551d3136717a0a993a',
        to: '2b78433e9bc17233ee14d822e10ff0d8ad61f37c990e9318275defd127e3bcda',
        amount: '10000000',
        fee: '5000000',
        sequence: '215752966240469006',
        minTime: 0,
        maxTime: 0,
        memoType: 'none',
        memo: '',
        isCreate: true,
      },
      protocol: types.PROTOCOL.SLIP0010,
    };
    const signedTx = await xlmSDK.signTransaction(transaction);
    expect(signedTx).toMatchInlineSnapshot(`
      Object {
        "data": Array [
          212,
          116,
          7,
          11,
          207,
          237,
          100,
          87,
          232,
          192,
          180,
          242,
          97,
          253,
          139,
          69,
          249,
          147,
          201,
          250,
          67,
          81,
          246,
          168,
          247,
          20,
          130,
          30,
          98,
          204,
          180,
          62,
          237,
          86,
          28,
          111,
          239,
          202,
          220,
          5,
          37,
          107,
          59,
          138,
          37,
          46,
          18,
          31,
          46,
          145,
          198,
          205,
          80,
          37,
          99,
          64,
          133,
          57,
          67,
          196,
          199,
          183,
          12,
          5,
        ],
        "type": "Buffer",
      }
    `);
  });

  it('Test Sign Transfer XLM Transaction for protocol BIP44', async () => {
    const transaction: types.signTxType = {
      transport: transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        from: '3a30655dcbf097ff5ccc3f6bb6a809cda73589c2b9d826551d3136717a0a993a',
        to: '2b78433e9bc17233ee14d822e10ff0d8ad61f37c990e9318275defd127e3bcda',
        amount: '10000000',
        fee: '5000000',
        sequence: '215752966240469006',
        minTime: 0,
        maxTime: 0,
        memoType: 'none',
        memo: '',
        isCreate: true,
      },
      protocol: types.PROTOCOL.BIP44,
    };
    const signedTx = await xlmSDK.signTransaction(transaction);
    expect(signedTx).toMatchInlineSnapshot(`
      Object {
        "data": Array [
          242,
          127,
          51,
          216,
          213,
          17,
          123,
          76,
          9,
          15,
          213,
          235,
          47,
          63,
          213,
          196,
          228,
          118,
          113,
          51,
          100,
          158,
          245,
          72,
          92,
          138,
          54,
          125,
          228,
          43,
          211,
          251,
          30,
          230,
          25,
          228,
          202,
          146,
          70,
          149,
          8,
          79,
          100,
          201,
          163,
          228,
          41,
          172,
          213,
          46,
          80,
          198,
          247,
          153,
          128,
          11,
          197,
          44,
          67,
          224,
          175,
          87,
          173,
          10,
        ],
        "type": "Buffer",
      }
    `);
  });
});
