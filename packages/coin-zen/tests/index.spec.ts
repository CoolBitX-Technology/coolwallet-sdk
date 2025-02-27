import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import ZEN from '../src';
import { ScriptType, signTxType } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test ETC SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const zenSDK = new ZEN();
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

  describe('Test Get Address', () => {
    it('index 0 address', async () => {
      const address = await zenSDK.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2PKH, 0);
      expect(address).toEqual('znnDufpMPVxEPeLRRXutq6ZEBkgf7gQcD25');
    });
  });

  describe('Sign Transfer Tx', () => {
    it('P2PKH transfer with address 0', async () => {
      const transaction: signTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        scriptType: ScriptType.P2PKH,
        inputs: [
          {
            preTxHash: '79c2eaf919aa1fe853d3f00cd742844b09fdf92bf510e1b6e9c5cfebbdeb4edd',
            preIndex: 1,
            scriptPubKey: `76a914b7847a272f6780b2429429345a018dbf3143a3d088ac20907db3cfe9ab4fea55f906018381b1f95a88edd98e6bfbdc200370000000000003bf3c1ab4`,
            addressIndex: 0,
          },
        ],
        output: {
          value: '25000000',
          address: 'znorDePMyGJJwWygQdYuELDQjwA2xWNZCGF',
          blockHash: '000000000210475f9bdb964d81d6276fbe98518a0002c212d8e437244bc01a21',
          blockHeight: 1723474,
        },
        change: {
          value: '24830000',
          addressIndex: 0,
          blockHash: '000000000210475f9bdb964d81d6276fbe98518a0002c212d8e437244bc01a21',
          blockHeight: 1723474,
        },
      };
      const tx = await zenSDK.signTransaction(transaction);
      expect(tx).toMatchInlineSnapshot(
        `"0100000001dd4eebbdebcfc5e9b6e110f52bf9fd094b8442d70cf0d353e81faa19f9eac279010000006a473044022046cec3d47ce990c8f55d4978e43e53b2c01f7a9726544d490df725de77996551022047b33be5b8a79f7c79359c3bc02e44f61a251704ef28783bc281246f3d39efb08121030ceff2eb84415264dede5edbcabbb6d133e91fc9ba00b6805f66093f65ea6a66ffffffff0240787d01000000003f76a914f9b3ce8a1327101a148eb577254dc647f214182488ac20211ac04b2437e4d812c202008a5198be6f27d6814d96db9b5f4710020000000003524c1ab430e07a01000000003f76a914e7ddb38ac76967361e52d3e1fffc371d97183d0988ac20211ac04b2437e4d812c202008a5198be6f27d6814d96db9b5f4710020000000003524c1ab400000000"`
      );
    });
  });
});
