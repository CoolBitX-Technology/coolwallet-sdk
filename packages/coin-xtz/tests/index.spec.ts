import { CardType, Transport } from '@coolwallet/core';
import { initialize, getTxDetail, DisplayBuilder, CURVE, HDWallet } from '@coolwallet/testing-library';
import { createTransport } from '@coolwallet/transport-jre-http';
import { localForger } from '@taquito/local-forging';
import {
  OpKind,
  OperationContentsReveal,
  OperationContentsTransaction,
  OperationContentsDelegation,
} from '@taquito/rpc';

import XTZ from '../src';
import * as codecUtil from '../src/utils/codecUtil';
import type { SignTxData, xtzTransaction, xtzReveal, xtzDelegation } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const testWalletInfo = {
  mnemonic: 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo card',
  address: 'tz1SRHdhAfRXLhePtJemonhEshg4ErQhivci',
};

/* eslint-disable @typescript-eslint/no-var-requires */
const blake2b = require('blake2b');

describe('Test XTZ SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let cardType: CardType;
  const xtz = new XTZ();
  const wallet = new HDWallet(CURVE.ED25519);

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
    props = await initialize(transport, testWalletInfo.mnemonic);
    wallet.setMnemonic(testWalletInfo.mnemonic);
  });

  it('XTZ: get address 0', async () => {
    const addressIndex = 0;

    // address from coolwallet
    const address = await xtz.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);

    // expected address
    const publicKey = await wallet.derivePath(`m/44'/1729'/${addressIndex}'/0'`).getPublicKey();
    console.log('publicKey :', publicKey?.toString('hex'));
    const expectedAddress = codecUtil.pubKeyToAddress(publicKey?.toString('hex') ?? '');
    console.log('expectedAddress :', expectedAddress);

    expect(address.toLowerCase()).toEqual(expectedAddress.toLowerCase());
  });

  it('XTZ: sign reveal', async () => {
    const addressIndex = 0;
    const node = wallet.derivePath(`m/44'/1729'/${addressIndex}'/0'`);
    const publicKey = await node.getPublicKey();
    const public_key = codecUtil.pubKeyHexToStr(publicKey?.toString('hex') ?? '');
    const address = codecUtil.pubKeyToAddress(publicKey?.toString('hex') ?? '');

    const kind = OpKind.REVEAL;
    const branch = 'BMHBtAaUv59LipV1czwZ5iQkxEktPJDE7A9sYXPkPeRzbBasNY8';
    const source = address;
    const fee = '1300';
    const counter = '3325582';
    const gas_limit = '10100';
    const storage_limit = '1';

    const operation: xtzReveal = { branch, source, fee, counter, gas_limit, storage_limit, public_key };
    const content: OperationContentsReveal = { kind, source, fee, counter, gas_limit, storage_limit, public_key };

    const { appPrivateKey, appId } = props;
    const signTxData: SignTxData = {
      transport,
      appPrivateKey,
      appId,
      addressIndex,
    };

    // check signature
    const signedTx = await xtz.signReveal(signTxData, operation);
    const txHex = await localForger.forge({ branch, contents: [content] });
    const hashHex = blake2b(32)
      .update(Buffer.from('03' + txHex, 'hex'))
      .digest('hex');
    const expectedSigUint8Array = await node.sign(hashHex);
    const expectedTx = txHex + Buffer.from(expectedSigUint8Array ?? '').toString('hex');
    expect(signedTx).toEqual(expectedTx);

    // check screen display
    if (cardType === CardType.Go) return;
    const txDetail = await getTxDetail(transport, props.appId);
    console.log('txDetail :', txDetail);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('XTZ')
      .messagePage('Reveal')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    console.log('expectedTxDetail :', expectedTxDetail);
    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it('XTZ: sign transaction', async () => {
    const addressIndex = 0;
    const node = wallet.derivePath(`m/44'/1729'/${addressIndex}'/0'`);
    const publicKey = await node.getPublicKey();
    const address = codecUtil.pubKeyToAddress(publicKey?.toString('hex') ?? '');

    const kind = OpKind.TRANSACTION;
    const branch = 'BMHBtAaUv59LipV1czwZ5iQkxEktPJDE7A9sYXPkPeRzbBasNY8';
    const source = address;
    const fee = '1300';
    const counter = '3325582';
    const gas_limit = '10100';
    const storage_limit = '1';
    const amount = '3500000';
    const destination = 'tz1YU2zoyCkXPKEA4jknSpCpMs7yUndVNe3S';

    const operation: xtzTransaction = {
      branch,
      source,
      fee,
      counter,
      gas_limit,
      storage_limit,
      amount,
      destination,
    };
    const content: OperationContentsTransaction = {
      kind,
      source,
      fee,
      counter,
      gas_limit,
      storage_limit,
      amount,
      destination,
    };

    const { appPrivateKey, appId } = props;
    const signTxData: SignTxData = {
      transport,
      appPrivateKey,
      appId,
      addressIndex,
    };

    // check signature
    const signedTx = await xtz.signTransaction(signTxData, operation);
    const txHex = await localForger.forge({ branch, contents: [content] });
    const hashHex = blake2b(32)
      .update(Buffer.from('03' + txHex, 'hex'))
      .digest('hex');
    const expectedSigUint8Array = await node.sign(hashHex);
    const expectedTx = txHex + Buffer.from(expectedSigUint8Array ?? '').toString('hex');
    expect(signedTx).toEqual(expectedTx);
    console.log('signedTx :', signedTx);

    // check screen display
    if (cardType === CardType.Go) return;
    const txDetail = await getTxDetail(transport, props.appId);
    console.log('txDetail :', txDetail);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('XTZ')
      .addressPage(destination)
      .amountPage(0.000001 * parseInt(amount))
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    console.log('expectedTxDetail :', expectedTxDetail);
    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it('XTZ: sign delegation', async () => {
    const addressIndex = 0;
    const node = wallet.derivePath(`m/44'/1729'/${addressIndex}'/0'`);
    const publicKey = await node.getPublicKey();
    const address = codecUtil.pubKeyToAddress(publicKey?.toString('hex') ?? '');

    const kind = OpKind.DELEGATION;
    const branch = 'BMHBtAaUv59LipV1czwZ5iQkxEktPJDE7A9sYXPkPeRzbBasNY8';
    const source = address;
    const fee = '1300';
    const counter = '3325582';
    const gas_limit = '10100';
    const storage_limit = '300';
    const delegate = 'tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9';

    const operation: xtzDelegation = { branch, source, fee, counter, gas_limit, storage_limit, delegate };
    const content: OperationContentsDelegation = { kind, source, fee, counter, gas_limit, storage_limit, delegate };

    const { appPrivateKey, appId } = props;
    const signTxData: SignTxData = {
      transport,
      appPrivateKey,
      appId,
      addressIndex,
    };

    // check signature
    const signedTx = await xtz.signDelegation(signTxData, operation);
    const txHex = await localForger.forge({ branch, contents: [content] });
    const hashHex = blake2b(32)
      .update(Buffer.from('03' + txHex, 'hex'))
      .digest('hex');
    const expectedSigUint8Array = await node.sign(hashHex);
    const expectedTx = txHex + Buffer.from(expectedSigUint8Array ?? '').toString('hex');
    expect(signedTx).toEqual(expectedTx);
    console.log('signedTx :', signedTx);

    // check screen display
    if (cardType === CardType.Go) return;
    const txDetail = await getTxDetail(transport, props.appId);
    console.log('txDetail :', txDetail);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('XTZ')
      .messagePage('Delgt')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    console.log('expectedTxDetail :', expectedTxDetail);
    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it('XTZ: sign undelegation', async () => {
    const addressIndex = 0;
    const node = wallet.derivePath(`m/44'/1729'/${addressIndex}'/0'`);
    const publicKey = await node.getPublicKey();
    const address = codecUtil.pubKeyToAddress(publicKey?.toString('hex') ?? '');

    const kind = OpKind.DELEGATION;
    const branch = 'BMHBtAaUv59LipV1czwZ5iQkxEktPJDE7A9sYXPkPeRzbBasNY8';
    const source = address;
    const fee = '1300';
    const counter = '3325582';
    const gas_limit = '10100';
    const storage_limit = '300';

    const operation: xtzDelegation = { branch, source, fee, counter, gas_limit, storage_limit };
    const content: OperationContentsDelegation = { kind, source, fee, counter, gas_limit, storage_limit };

    const { appPrivateKey, appId } = props;
    const signTxData: SignTxData = {
      transport,
      appPrivateKey,
      appId,
      addressIndex,
    };

    // check signature
    const signedTx = await xtz.signUndelegation(signTxData, operation);
    const txHex = await localForger.forge({ branch, contents: [content] });
    const hashHex = blake2b(32)
      .update(Buffer.from('03' + txHex, 'hex'))
      .digest('hex');
    const expectedSigUint8Array = await node.sign(hashHex);
    const expectedTx = txHex + Buffer.from(expectedSigUint8Array ?? '').toString('hex');
    expect(signedTx).toEqual(expectedTx);
    console.log('signedTx :', signedTx);

    // check screen display
    if (cardType === CardType.Go) return;
    const txDetail = await getTxDetail(transport, props.appId);
    console.log('txDetail :', txDetail);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('XTZ')
      .messagePage('UnDel')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    console.log('expectedTxDetail :', expectedTxDetail);
    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });
});
