/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-len */
import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import BCH from '../../coin-bch/src';
import * as types from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer P> ? P : never;

describe('Test BCH SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  const bch = new BCH();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo card';

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
  });

  it('BCH test get address 0', async () => {
    const addressIndex = 0;
    const address = await bch.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
    expect(address).toMatchInlineSnapshot(`"bitcoincash:qqsykjppczqgptj2pxkyx7vhzldgteer75axzvzqmz"`);
  });

  describe('BCH signTransaction', () => {
    const inputs = [
      {
        preTxHash: 'a8e10cdf0dada34b1c22ef976299331701ce9a55c3ee114deee259f76bd1fa7f',
        preIndex: 0,
        preValue: '9013114',
        addressIndex: 0,
      },
    ];

    const output = {
      address: '12XsqVooX3c3TUUfSBFLqaxtGxELHnumb7',
      value: '1000000',
    };

    const change = {
      addressIndex: 0,
      value: '8004114',
    };

    it('to address starts with 1', async () => {
      const signTxObject: types.signTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        scriptType: bch.ScriptType.P2PKH,
        inputs,
        output,
        change,
      };
      const signedTx = await bch.signTransaction(signTxObject);
      expect(signedTx).toMatchInlineSnapshot(
        `"01000000017ffad16bf759e2ee4d11eec3559ace011733996297ef221c4ba3ad0ddf0ce1a8000000006b483045022100c80a57a37578b623a787cd55dfe0a6887a7be96faef9fb965a9e433d1599937e0220517cef97b34d72ad039037b790c551e899cd3cb6ad03282443ef0a0b3914da0b4121037bae8ad5dd171efdc3a911cebd3d31cd2ffb0892cd63dc6eb00ec716ca446504ffffffff0240420f00000000001976a91410cf0a5f63558110de85bfb26fa94e4740c5238b88ac12227a00000000001976a914204b4821c08080ae4a09ac43799717da85e723f588ac00000000"`
      );
    });

    it('to address starts with 3', async () => {
      const signTxObject: types.signTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        scriptType: bch.ScriptType.P2PKH,
        inputs,
        output: { ...output, address: '3H62dZMmocjZub6y2r18vgrem3EKsELg2p' },
        change,
      };
      const signedTx = await bch.signTransaction(signTxObject);
      expect(signedTx).toMatchInlineSnapshot(
        `"01000000017ffad16bf759e2ee4d11eec3559ace011733996297ef221c4ba3ad0ddf0ce1a8000000006a47304402203919719b9667d743fb17bf666526712b888aeb21ce5ada47ee6d4bb6f62521a3022008df62938384ddff07ccbbd73a4b54aec22589609a011ec6cf0a1a4a845026014121037bae8ad5dd171efdc3a911cebd3d31cd2ffb0892cd63dc6eb00ec716ca446504ffffffff0240420f000000000017a914a8e40b4f6cd04ef541888ea2c047e3d8a38ef3798712227a00000000001976a914204b4821c08080ae4a09ac43799717da85e723f588ac00000000"`
      );
    });

    it('to address starts with 3 and no changes', async () => {
      const signTxObject: types.signTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        scriptType: bch.ScriptType.P2PKH,
        inputs,
        output: { ...output, address: '3H62dZMmocjZub6y2r18vgrem3EKsELg2p' },
        change: undefined,
      };
      const signedTx = await bch.signTransaction(signTxObject);
      expect(signedTx).toMatchInlineSnapshot(
        `"01000000017ffad16bf759e2ee4d11eec3559ace011733996297ef221c4ba3ad0ddf0ce1a8000000006a4730440220692e371bd512c45cf5c1ef7408554be03819cf1465d74a0a5c9dc238c780d0fe0220772579b7191c89260d30c9cfe93ec53ac0d75c1b83f4692ab714a29a91183a224121037bae8ad5dd171efdc3a911cebd3d31cd2ffb0892cd63dc6eb00ec716ca446504ffffffff0140420f000000000017a914a8e40b4f6cd04ef541888ea2c047e3d8a38ef3798700000000"`
      );
    });
  });
});
