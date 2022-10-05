import crypto from 'node:crypto';
import { inspect } from 'node:util';
import * as bip39 from 'bip39';
import BigNumber from 'bignumber.js';
import { apdu, Transport, config, utils, crypto as cwCrypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, getTxDetail, DisplayBuilder } from '@coolwallet/testing-library';
import * as VeChain from 'thor-devkit';
import VetSDK from '../src';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const mnemonic = bip39.generateMnemonic();

let props: PromiseValue<ReturnType<typeof initialize>>;
let transport: Transport;
const privKey = VeChain.mnemonic.derivePrivateKey(mnemonic.split(' '));
const vetSDK = new VetSDK();

const toWei = (n: number, d = 18) => {
  const decimal = new BigNumber(10).pow(d);
  return new BigNumber(n, 10).multipliedBy(decimal);
};

describe('Test VeChain SDK', () => {
  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
  });

  beforeEach(function () {
    return new Promise((resolve) => setTimeout(resolve, 500));
  });

  it('Test Get Address', async () => {
    const addressIndex = 0;
    const address = await vetSDK.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
    const expected = VeChain.address.fromPublicKey(VeChain.secp256k1.derivePublicKey(privKey));
    expect(address.toLowerCase()).toEqual(expected.toLowerCase());
  });

  //f83b4a87ca29e4a0f45a9a8303f480dedd946d48628bb5bf20 e5b4e591c948e0394e0d5bb0788609184e72 a000800082c3508088 ad2966219c85185bc0
  //f83b4a87ca29e4a0f45a9a8303f480dedd946d48628bb5bf20 e5b4e591c948e0394e0d5bb0788609184e72 a000808082c3508088 ad2966219c85185bc0
  it('Test Sign Transaction', async () => {
    const nonce = `0x${crypto.randomBytes(8).toString('hex')}`;
    const addressIndex = 0;
    const to = '0x6d48628bb5bf20e5b4e591c948e0394e0d5bb078';
    const amount = 0.00001;
    const txParam = {
      chainTag: 0x4a,
      blockRef: '0x00ca29e4a0f45a9a',
      expiration: 30 * 8640,
      clauses: [
        {
          to,
          value: `0x${toWei(amount).toString(16)}`,
          data: '0x',
        },
      ],
      gasPriceCoef: 0,
      gas: 0xC350,
      dependsOn: '',
      nonce,
    };
    const cwParam = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex,
    };
    try {
      const signedTx = await vetSDK.signTransaction(cwParam, txParam);
      const expectedTx = new VeChain.Transaction(txParam);
      const expectedSignature = VeChain.secp256k1.sign(VeChain.blake2b256(expectedTx.encode()), privKey);
      expectedTx.signature = expectedSignature;
      const txDetail = await getTxDetail(transport, props.appId);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .wrapPage('VET', '')
        .addressPage(to)
        .amountPage(amount)
        .wrapPage('PRESS', 'BUTToN')
        .finalize();
      expect(signedTx.slice(2)).toEqual(expectedTx.encode().toString('hex'));
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    } catch (e) {
      console.log(inspect(txParam, false, 5, true));
      console.log(mnemonic);
      throw e;
    }
  });

  it('Test Sign VTHO Token Transaction', async () => {
    const nonce = `0x${crypto.randomBytes(8).toString('hex')}`;
    const addressIndex = 0;
    const amount = 0.00001;
    const to = '0x6d48628bb5bf20e5b4e591c948e0394e0d5bb078';
    const txParam = {
      chainTag: 0x4a,
      blockRef: '0x00ca29e4a0f45a9a',
      expiration: 30 * 8640,
      clauses: [
        {
          to: '0x0000000000000000000000000000456E65726779',
          value: 0,
          data: `0xa9059cbb${to.slice(2).padStart(64, '0')}${toWei(amount, 18).toString(16).padStart(64, '0')}`,
        },
      ],
      gasPriceCoef: 0,
      gas: 0xC350,
      dependsOn: '',
      nonce,
    };
    const cwParam = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex,
    };
    try {
      const signedTx = await vetSDK.signTransaction(cwParam, txParam);
      const expectedTx = new VeChain.Transaction(txParam);
      const expectedSignature = VeChain.secp256k1.sign(VeChain.blake2b256(expectedTx.encode()), privKey);
      expectedTx.signature = expectedSignature;
      const txDetail = await getTxDetail(transport, props.appId);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .wrapPage('VET', '')
        .messagePage('VTHO')
        .addressPage(to)
        .amountPage(amount)
        .wrapPage('PRESS', 'BUTToN')
        .finalize();
      expect(signedTx.slice(2)).toEqual(expectedTx.encode().toString('hex'));
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    } catch (e) {
      console.log(inspect(txParam, false, 5, true));
      console.log(mnemonic);
      throw e;
    }
  });

  it('Test Sign Contract Transaction', async () => {
    const nonce = `0x${crypto.randomBytes(8).toString('hex')}`;
    const addressIndex = 0;
    const to = '0x6d48628bb5bf20e5b4e591c948e0394e0d5bb078';
    const value = 0;
    const txParam = {
      chainTag: 0x4a,
      blockRef: '0x00ca29e4a0f45a9a',
      expiration: 30 * 8640,
      clauses: [
        {
          to,
          value,
          data: '0x74f667c4',
        },
      ],
      gasPriceCoef: 0,
      gas: 0xC350,
      dependsOn: '',
      nonce,
    };
    const cwParam = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex,
    };
    try {
      const signedTx = await vetSDK.signTransaction(cwParam, txParam);
      const expectedTx = new VeChain.Transaction(txParam);
      const expectedSignature = VeChain.secp256k1.sign(VeChain.blake2b256(expectedTx.encode()), privKey);
      expectedTx.signature = expectedSignature;
      const txDetail = await getTxDetail(transport, props.appId);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .wrapPage('VET', '')
        .wrapPage('SMART', '')
        .addressPage(to)
        .amountPage(value)
        .wrapPage('PRESS', 'BUTToN')
        .finalize();
      expect(signedTx.slice(2)).toEqual(expectedTx.encode().toString('hex'));
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    } catch (e) {
      console.log(inspect(txParam, false, 5, true));
      console.log(mnemonic);
      throw e;
    }
  });
});
