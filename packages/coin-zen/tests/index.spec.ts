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
  
  const inputs = [
    {
      preTxHash: '7ff81b3ac9f393bfb647c91b9d4d27f2cc7da07bec88fde06ad44b7e5319d333',
      preIndex: 1,
      scriptPubKey: '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac',
      addressIndex: 0,
    },
    {
      preTxHash: '253d66d2baef4fa79d7c33f096d1038f730b58e4cfeaa5e6bc485019b843f34c',
      preIndex: 0,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac2025864e944de8a0d0330d5ce4047e6a8af68dc43ff9277e3b22b77a01000000000328cb19b4',
      addressIndex: 0,
    },
    {
      preTxHash: '3a2648a285852f5b924f336cab35f8bb78db10858e451c7fdbbcaa73904569e9',
      preIndex: 0,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac20115e3b4d7656e290933d647ea2a65b286010ffcb1b3333da0693fd00000000000396041ab4',
      addressIndex: 0,
    },
    {
      preTxHash: '7aefbfb639bd28f481cc43d60f604884e1bbaca5aeeb29049909326e6cdc99dd',
      preIndex: 0,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac20225dc432a0f95705722530b77583b5d78f6c94adcb1cc14c8dcb1103000000000395041ab4',
      addressIndex: 0,
    },
    {
      preTxHash: '7d68d851fd9823080d4b1ce8405a54949565accf454c67f0086c046863977093',
      preIndex: 0,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac2062b3025ccc2dd8d6edd2462f9391dad2f92f7c6d32c29c34d193bc03000000000397041ab4',
      addressIndex: 0,
    },
    {
      preTxHash: 'e9fde327d061b322a232afbc6e0224a71000a02364eb8cc305ad0e186eda762d',
      preIndex: 0,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac205c7dc98221b036d87c5e4fa1d846d6140e489e0da3b9fdf765386e02000000000394041ab4',
      addressIndex: 0,
    },
    {
      preTxHash: '5ea617344f0575cbf0b9d20db658d51cfb129377e04b210da87d307b760476f3',
      preIndex: 0,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac2000790cde77950501ffe10eb4caafd44a18ae89be6aa7a20187dae300000000000380041ab4',
      addressIndex: 0,
    },
    {
      preTxHash: '60c4b1ef5371c0e5764018f12787bb6aa974c2bd4556d9d03395b58456a4ae8e',
      preIndex: 143,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac209f36b4693e96bd5d79508a6cce57617e03c7d46e9a9db5c5b5e157030000000003eaa219b4',
      addressIndex: 0,
    },
    {
      preTxHash: 'a2d16fe7982614bc814362528c1934410ce1338417783e98fa7a77e5c5b9f1e4',
      preIndex: 297,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac209f36b4693e96bd5d79508a6cce57617e03c7d46e9a9db5c5b5e157030000000003eaa219b4',
      addressIndex: 0,
    },
  ];

  const output = {
    value: 1000000000,
    address: 'znaRmosZDTG8zYBsNcheCN4LsgpVjPYE8Ay',
    blockHash: '00000000023c6af45cafdc6278a48ecde601a7077e62d08afa7109987d3297dd',
    blockHeight: 1705874,
  };

  const change = {
    value: 157112533,
    addressIndex: 0,
    blockHash: '00000000023c6af45cafdc6278a48ecde601a7077e62d08afa7109987d3297dd',
    blockHeight: 1705874,
  };

  it.skip('zen tx', async () => {
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
