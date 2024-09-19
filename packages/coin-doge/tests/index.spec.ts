import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import * as types from '../src/config/types';
import DOGE from '../src';
import { ScriptType } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test DOGE SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const dogeSDK = new DOGE();
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

  it('index 0 address', async () => {
    const address = await dogeSDK.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2PKH, 0, 44);
    expect(address).toMatchInlineSnapshot(`"DPsNjkrF3WBx6cCKQpd278JjLp3o4JuQWU"`);
  });

  it('Test Sign Transfer Doge Transaction', async () => {
    const transaction: types.signTxType = {
      transport: transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      scriptType: ScriptType.P2PKH,
      inputs: [
        {
          preTxHash: '861a91798956d1a4210380ac3a7195ae171c0de0512749fdac6f134b725f70c2',
          preIndex: 0,
          preValue: '100000000',
          sequence: 4294967293,
          addressIndex: 0,
          purposeIndex: 44,
        },
      ],
      output: { address: 'DBgbJaMtK7fnN3D8AwemHyieWybf45xoUC', value: '1000000' },
      change: { addressIndex: 0, value: '96447375', purposeIndex: 44 },
      version: 2,
    };
    const signedTx = await dogeSDK.signTransaction(transaction);
    expect(signedTx).toMatchInlineSnapshot(
      `"0200000001c2705f724b136facfd492751e00d1c17ae95713aac800321a4d1568979911a86000000006a473044022078f6c2eac9b8423f168782b1e7f1e5c5af56c23525f64087f1e741ae281bb873022054b13e9c31dc9567508fb806a8c9c18ee99efabc08808c8f2d7658f326a454318121029097c88ae8fda850ae1bfce78b47d047257ac7b5bd8c661b1163f5ebaacf45eafdffffff0240420f00000000001976a91447c5a91b82ec241bf45650324d0997e5b5a77e6d88ac8fabbf05000000001976a914cd71419110ef3fb035bdb7d0a3350eabd25dd2f488ac00000000"`
    );
  });
});
