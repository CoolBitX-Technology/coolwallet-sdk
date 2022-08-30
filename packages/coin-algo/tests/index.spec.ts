import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, DisplayBuilder, getTxDetail, HDWallet, CURVE } from '@coolwallet/testing-library';
import * as bip39 from 'bip39';
import * as algosdk from 'algosdk';
import * as nacl from 'tweetnacl';
import ALGO from '../src';
import type { PromiseValue } from './types';

let props: PromiseValue<ReturnType<typeof initialize>>;
let transport: Transport;

const mnemonic = bip39.generateMnemonic();
const algosdk_cw = new ALGO();
const hdWallet = new HDWallet(CURVE.ED25519);
const suggestedParams = {
  genesisHash: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
  fee: 1000,
  firstRound: 23386222,
  lastRound: 23386222,
  genesisID: 'mainnet-v1.0',
};
const randomAmount = (decimals: number) => Math.floor(Math.random() * 10 ** decimals);
const randomAppIndex = () => Math.floor(Math.random() * 10 ** 6);
const randomAssetIndex = () => Math.floor(Math.random() * 10 ** 6);

describe('Test CoolWallet Algorand SDK', () => {
  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
    hdWallet.setMnemonic(mnemonic);
  });

  it('Test Algorand Get Address', async () => {
    const addressIndex = 1;
    const address = await algosdk_cw.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
    const node = hdWallet.derivePath(`m/44'/283'/0'/0'/${addressIndex}'`);
    const publicKey = await node.getPublicKey();
    const expected = algosdk.encodeAddress(publicKey!);
    expect(address).toEqual(expected);
  });

  it('Test Algorand Payment Transaction', async () => {
    const addressIndex = 0;
    const from = await algosdk_cw.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
    const toAccount = algosdk.generateAccount();
    const amount = randomAmount(6);
    const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from,
      to: toAccount.addr,
      amount,
      suggestedParams,
    });
    const transaction = payment.get_obj_for_encoding();
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction,
      addressIndex,
    };

    const signedTx = await algosdk_cw.signTransaction(signTxData);
    const txDetail = await getTxDetail(transport, props.appId);

    const node = hdWallet.derivePath(`m/44'/283'/0'/0'/${addressIndex}'`);
    const keyPair = nacl.sign.keyPair.fromSeed(node.privateKey);
    const expectedSignedTx = payment.signTxn(keyPair.secretKey);

    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('ALGO')
      .messagePage('pay')
      .amountPage(amount / 10 ** 6)
      .addressPage(toAccount.addr)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    try {
      expect(signedTx).toEqual(Buffer.from(expectedSignedTx).toString('hex'));
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    } catch (e) {
      console.log(algosdk.decodeSignedTransaction(Buffer.from(signedTx, 'hex')));
      console.log(algosdk.decodeSignedTransaction(expectedSignedTx));
      throw e;
    }
  });

  it('Test Algorand Rekey Payment Transaction', async () => {
    const addressIndex = 0;
    const from = await algosdk_cw.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
    const toAccount = algosdk.generateAccount();
    const amount = randomAmount(6);
    const rekeyPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from,
      to: toAccount.addr,
      rekeyTo: toAccount.addr,
      amount,
      suggestedParams,
    });
    const transaction = rekeyPayment.get_obj_for_encoding();
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction,
      addressIndex,
    };

    const signedTx = await algosdk_cw.signTransaction(signTxData);
    const txDetail = await getTxDetail(transport, props.appId);

    const node = hdWallet.derivePath(`m/44'/283'/0'/0'/${addressIndex}'`);
    const keyPair = nacl.sign.keyPair.fromSeed(node.privateKey);
    const expectedSignedTx = rekeyPayment.signTxn(keyPair.secretKey);

    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('ALGO')
      .messagePage('pay')
      .amountPage(amount / 10 ** 6)
      .addressPage(toAccount.addr)
      .messagePage('rekey')
      .addressPage(toAccount.addr)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    try {
      expect(signedTx).toEqual(Buffer.from(expectedSignedTx).toString('hex'));
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    } catch (e) {
      console.log(algosdk.decodeSignedTransaction(Buffer.from(signedTx, 'hex')));
      console.log(algosdk.decodeSignedTransaction(expectedSignedTx));
      throw e;
    }
  });

  it('Test Algorand Asset Transaction', async () => {
    const addressIndex = 0;
    const from = await algosdk_cw.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
    const toAccount = algosdk.generateAccount();
    const amount = randomAmount(6);
    const assetIndex = randomAssetIndex();
    const assetTransfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from,
      to: toAccount.addr,
      assetIndex,
      amount,
      suggestedParams,
    });
    const transaction = assetTransfer.get_obj_for_encoding();
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction,
      addressIndex,
    };

    const signedTx = await algosdk_cw.signTransaction(signTxData);
    const txDetail = await getTxDetail(transport, props.appId);

    const node = hdWallet.derivePath(`m/44'/283'/0'/0'/${addressIndex}'`);
    const keyPair = nacl.sign.keyPair.fromSeed(node.privateKey);
    const expectedSignedTx = assetTransfer.signTxn(keyPair.secretKey);

    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('ALGO')
      .messagePage('axfer')
      .messagePage('assetID')
      .messagePage(assetIndex.toString())
      .addressPage(toAccount.addr)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    try {
      expect(signedTx).toEqual(Buffer.from(expectedSignedTx).toString('hex'));
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    } catch (e) {
      console.log(algosdk.decodeSignedTransaction(Buffer.from(signedTx, 'hex')));
      console.log(algosdk.decodeSignedTransaction(expectedSignedTx));
      throw e;
    }
  });

  it('Test Algorand Application Call Transaction', async () => {
    const addressIndex = 0;
    const from = await algosdk_cw.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
    const appIndex = randomAppIndex();
    const applicationCall = algosdk.makeApplicationNoOpTxnFromObject({
      from,
      suggestedParams,
      appIndex,
      appArgs: [],
    });
    const transaction = applicationCall.get_obj_for_encoding();
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction,
      addressIndex,
    };

    const signedTx = await algosdk_cw.signTransaction(signTxData);
    const txDetail = await getTxDetail(transport, props.appId);

    const node = hdWallet.derivePath(`m/44'/283'/0'/0'/${addressIndex}'`);
    const keyPair = nacl.sign.keyPair.fromSeed(node.privateKey);
    const expectedSignedTx = applicationCall.signTxn(keyPair.secretKey);

    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('ALGO')
      .messagePage('appl')
      .messagePage('appID')
      .messagePage(appIndex.toString())
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    try {
      expect(signedTx).toEqual(Buffer.from(expectedSignedTx).toString('hex'));
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    } catch (e) {
      console.log(algosdk.decodeSignedTransaction(Buffer.from(signedTx, 'hex')));
      console.log(algosdk.decodeSignedTransaction(expectedSignedTx));
      throw e;
    }
  });
});
