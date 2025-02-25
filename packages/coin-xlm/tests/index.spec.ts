import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import * as types from '../src/config/types';
import XLM from '../src';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test XLM SDK', () => {
  describe('Test XLM CoinType', () => {
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

  describe('Test KAG CoinType', () => {
    let transport: Transport;
    let props: Mandatory;
    let cardType: CardType;
    const xlmSDK = new XLM(types.COIN_SPECIES.KAG);
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

    it('Test Sign Transfer KAG Transaction for protocol SLIP0010', async () => {
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
            71,
            64,
            80,
            186,
            185,
            166,
            250,
            144,
            12,
            220,
            127,
            205,
            112,
            221,
            246,
            211,
            119,
            180,
            68,
            231,
            15,
            152,
            21,
            139,
            165,
            139,
            138,
            89,
            108,
            197,
            155,
            8,
            117,
            156,
            119,
            116,
            23,
            83,
            0,
            128,
            251,
            166,
            64,
            189,
            135,
            218,
            75,
            130,
            45,
            119,
            41,
            64,
            33,
            174,
            165,
            51,
            165,
            75,
            131,
            1,
            69,
            91,
            48,
            15,
          ],
          "type": "Buffer",
        }
      `);
    });

    it('Test Sign Transfer KAG Transaction for protocol BIP44', async () => {
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
            197,
            77,
            192,
            111,
            71,
            191,
            249,
            42,
            132,
            143,
            223,
            242,
            248,
            16,
            165,
            18,
            214,
            33,
            81,
            162,
            248,
            214,
            57,
            73,
            14,
            0,
            143,
            117,
            63,
            223,
            117,
            19,
            41,
            151,
            58,
            46,
            45,
            92,
            162,
            230,
            55,
            100,
            109,
            59,
            239,
            160,
            7,
            94,
            58,
            74,
            5,
            2,
            97,
            255,
            82,
            49,
            234,
            120,
            62,
            208,
            50,
            163,
            122,
            7,
          ],
          "type": "Buffer",
        }
      `);
    });
  });

  describe.only('Test KAU CoinType', () => {
    let transport: Transport;
    let props: Mandatory;
    let cardType: CardType;
    const xlmSDK = new XLM(types.COIN_SPECIES.KAU);
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

    it('Test Sign Transfer KAG Transaction for protocol SLIP0010', async () => {
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
            87,
            235,
            68,
            107,
            116,
            56,
            216,
            196,
            124,
            145,
            22,
            112,
            116,
            224,
            10,
            53,
            104,
            118,
            113,
            209,
            56,
            75,
            161,
            69,
            154,
            212,
            110,
            66,
            13,
            24,
            65,
            202,
            128,
            133,
            41,
            188,
            43,
            233,
            106,
            102,
            234,
            106,
            246,
            177,
            73,
            206,
            216,
            64,
            97,
            176,
            0,
            61,
            98,
            14,
            43,
            64,
            42,
            255,
            228,
            70,
            217,
            225,
            186,
            15,
          ],
          "type": "Buffer",
        }
      `);
    });

    it('Test Sign Transfer KAG Transaction for protocol BIP44', async () => {
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
            78,
            0,
            41,
            46,
            153,
            72,
            156,
            239,
            138,
            25,
            159,
            4,
            220,
            31,
            64,
            168,
            156,
            244,
            68,
            180,
            38,
            191,
            206,
            188,
            201,
            101,
            14,
            134,
            147,
            78,
            87,
            99,
            5,
            111,
            137,
            93,
            227,
            227,
            35,
            97,
            184,
            27,
            55,
            184,
            200,
            83,
            179,
            84,
            84,
            24,
            11,
            220,
            121,
            172,
            88,
            141,
            69,
            208,
            1,
            89,
            252,
            83,
            0,
            8,
          ],
          "type": "Buffer",
        }
      `);
    });
  });
});
