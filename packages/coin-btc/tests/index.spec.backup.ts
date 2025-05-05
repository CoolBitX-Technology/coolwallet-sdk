import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, HDWallet, CURVE, DisplayBuilder, getTxDetail } from '@coolwallet/testing-library';
import ECPairFactory from 'ecpair';
import * as TinySecp256k1 from '@bitcoin-js/tiny-secp256k1-asmjs';
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import BTC from '../src';
import { ScriptType, signTxType, signUSDTTxType } from '../src/config/types';
import { calculateSegwitFee } from './utils/transaction';

type PromiseValue<T> = T extends Promise<infer P> ? P : never;
const ECPair = ECPairFactory(TinySecp256k1);

// this file need update 
describe('Test BTC SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  const btc = new BTC();
  const mnemonic = bip39.generateMnemonic();
  const wallet = new HDWallet(CURVE.SECP256K1);

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    transport = (await createTransport(undefined, CardType.Lite))!;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    props = await initialize(transport, mnemonic);
    wallet.setMnemonic(mnemonic);
  });

  it('BTC test get address 0', async () => {
    const publicKey = await wallet.derivePath(`m/44'/0'/0'/0/0`).getPublicKey();
    // P2PKH
    const p2pkh = await btc.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2PKH, 0);
    const { address: expected_p2pkh } = bitcoin.payments.p2pkh({ pubkey: publicKey });
    expect(p2pkh).toEqual(expected_p2pkh);

    // P2SH_P2WPKH
    const p2sh_p2wpkh = await btc.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2SH_P2WPKH, 0);
    const { address: expected_p2sh_p2wpkh } = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({ pubkey: publicKey }),
    });
    expect(p2sh_p2wpkh).toEqual(expected_p2sh_p2wpkh);

    // P2WPKH
    const p2wpkh = await btc.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2WPKH, 0);
    const { address: expected_p2wpkh } = bitcoin.payments.p2wpkh({ pubkey: publicKey });
    expect(p2wpkh).toEqual(expected_p2wpkh);
  });

  it('BTC test sign P2PKH without change transaction', async () => {
    const accountNode = wallet.derivePath(`m/44'/0'/0'/0/0`);
    const privateKey = accountNode.privateKey;
    const publicKey = await accountNode.getPublicKey();

    const network = bitcoin.networks.bitcoin;
    const toAddress = '1KRMKfeZcmosxALVYESdPNez1AP1mEtywp';
    const amount = 14150;
    const payment = bitcoin.payments.p2pkh({
      pubkey: publicKey,
      network,
    });

    const nonWitnessUtxo = Buffer.from(
      //version
      '02000000' +
        //input count
        '01' +
        //tx hash
        'cebc7aa4e89c0e34598a0d2758fc96d8af2fda494dc4c00b12929ae1649e3847' +
        //tx index
        '00000000' +
        //script sig size
        '6b' +
        //signature size
        '48' +
        //signature
        `3045022100c86e9a111afc90f64b4904bd609e9eaed80d48ca17c162b1aca0a788ac3526f002207bb79b60d4fc6526329bf18a77135dc5660209e761da46e1c2f1152ec013215801` +
        //script
        `210211755115eabf846720f5cb18f248666fec631e5e1e66009ce3710ceea5b1ad13` +
        //sequence
        'fffffffd' +
        //output count
        '01' +
        // value in satoshis (Int64LE) = 0x015f90 = 90000
        '905f010000000000' +
        // scriptPubkey length
        '19' +
        // scriptPubkey
        `${payment.output?.toString('hex')}` +
        // locktime
        '00000000',
      'hex'
    );
    const txHash = bitcoin.crypto.hash256(nonWitnessUtxo).toString('hex');
    const inputs = [
      {
        txHash: Buffer.from(txHash, 'hex').reverse().toString('hex'),
        txIndex: 0,
        value: 90000,
        sequence: 0xfffffffd,
        addressIndex: 0,
      },
    ];

    const options: signTxType = {
      transport,
      appId: props.appId,
      appPrivateKey: props.appPrivateKey,
      scriptType: ScriptType.P2PKH,
      inputs: inputs.map((i) => ({
        preTxHash: i.txHash,
        preIndex: i.txIndex,
        preValue: '' + i.value,
        sequence: i.sequence,
        addressIndex: i.addressIndex,
      })),
      output: {
        address: toAddress,
        value: amount.toString(),
      },
      version: 2,
    };

    const signature = await btc.signTransaction(options);
    const sighashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_ANYONECANPAY;

    const signer = ECPair.fromPrivateKey(privateKey, { network });
    const psbt = new bitcoin.Psbt();
    psbt.setVersion(2);
    psbt.setLocktime(0);
    psbt.addInputs(
      inputs.map((i) => ({
        hash: i.txHash,
        index: i.txIndex,
        sequence: i.sequence,
        nonWitnessUtxo,
        sighashType,
      }))
    );
    psbt.addOutput({
      address: toAddress,
      value: amount,
    });
    psbt.signAllInputs(signer, [sighashType]);
    psbt.finalizeAllInputs();

    expect(signature).toEqual(psbt.extractTransaction().toHex());

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('BTC')
      .addressPage(toAddress)
      .amountPage(amount / 1e8)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it('BTC test sign P2PKH transaction', async () => {
    const accountNode = wallet.derivePath(`m/44'/0'/0'/0/0`);
    const privateKey = accountNode.privateKey;
    const publicKey = await accountNode.getPublicKey();

    const network = bitcoin.networks.bitcoin;
    const toAddress = '1KRMKfeZcmosxALVYESdPNez1AP1mEtywp';
    const amount = 14150;
    const payment = bitcoin.payments.p2pkh({
      pubkey: publicKey,
      network,
    });

    const nonWitnessUtxo = Buffer.from(
      //version
      '02000000' +
        //input count
        '01' +
        //tx hash
        'cebc7aa4e89c0e34598a0d2758fc96d8af2fda494dc4c00b12929ae1649e3847' +
        //tx index
        '00000000' +
        //script sig size
        '6b' +
        //signature size
        '48' +
        //signature
        `3045022100c86e9a111afc90f64b4904bd609e9eaed80d48ca17c162b1aca0a788ac3526f002207bb79b60d4fc6526329bf18a77135dc5660209e761da46e1c2f1152ec013215801` +
        //script
        `210211755115eabf846720f5cb18f248666fec631e5e1e66009ce3710ceea5b1ad13` +
        //sequence
        'fffffffd' +
        //output count
        '01' +
        // value in satoshis (Int64LE) = 0x015f90 = 90000
        '905f010000000000' +
        // scriptPubkey length
        '19' +
        // scriptPubkey
        `${payment.output?.toString('hex')}` +
        // locktime
        '00000000',
      'hex'
    );
    const txHash = bitcoin.crypto.hash256(nonWitnessUtxo).toString('hex');
    const inputs = [
      {
        txHash: Buffer.from(txHash, 'hex').reverse().toString('hex'),
        txIndex: 0,
        value: 90000,
        sequence: 0xfffffffd,
        addressIndex: 0,
      },
    ];

    const fee = calculateSegwitFee(ECPair, inputs, network);
    const change = inputs.reduce((acc, i) => acc + i.value, 0) - amount - fee;

    const options: signTxType = {
      transport,
      appId: props.appId,
      appPrivateKey: props.appPrivateKey,
      scriptType: ScriptType.P2PKH,
      inputs: inputs.map((i) => ({
        preTxHash: i.txHash,
        preIndex: i.txIndex,
        preValue: '' + i.value,
        sequence: i.sequence,
        addressIndex: i.addressIndex,
      })),
      output: {
        address: toAddress,
        value: amount.toString(),
      },
      change: {
        addressIndex: 0,
        value: change.toString(),
      },
      version: 2,
    };

    const signature = await btc.signTransaction(options);
    const sighashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_ANYONECANPAY;

    const signer = ECPair.fromPrivateKey(privateKey, { network });
    const psbt = new bitcoin.Psbt();
    psbt.setVersion(2);
    psbt.setLocktime(0);
    psbt.addInputs(
      inputs.map((i) => ({
        hash: i.txHash,
        index: i.txIndex,
        sequence: i.sequence,
        nonWitnessUtxo,
        sighashType,
      }))
    );
    psbt.addOutput({
      address: toAddress,
      value: amount,
    });
    psbt.addOutput({
      address: payment.address!,
      value: change,
    });
    psbt.signAllInputs(signer, [sighashType]);
    psbt.finalizeAllInputs();

    expect(signature).toEqual(psbt.extractTransaction().toHex());

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('BTC')
      .addressPage(toAddress)
      .amountPage(amount / 1e8)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it('BTC test sign P2PKH USDT without change transaction', async () => {
    const accountNode = wallet.derivePath(`m/44'/0'/0'/0/0`);
    const privateKey = accountNode.privateKey;
    const publicKey = await accountNode.getPublicKey();

    const toAddress = '3QWBFHqJSjkcDcokSozVxUbtMaRJ59xRv5';
    const amount = +105 * 1e8;
    const network = bitcoin.networks.bitcoin;
    // Omni will need at least 546 satoshis to complete the transaction.
    const fund = 546;
    const payment = bitcoin.payments.p2pkh({
      pubkey: publicKey,
      network,
    });

    const nonWitnessUtxo = Buffer.from(
      //version
      '02000000' +
        //input count
        '01' +
        //tx hash
        'cebc7aa4e89c0e34598a0d2758fc96d8af2fda494dc4c00b12929ae1649e3847' +
        //tx index
        '00000000' +
        //script sig size
        '6b' +
        //signature size
        '48' +
        //signature
        `3045022100c86e9a111afc90f64b4904bd609e9eaed80d48ca17c162b1aca0a788ac3526f002207bb79b60d4fc6526329bf18a77135dc5660209e761da46e1c2f1152ec013215801` +
        //script
        `210211755115eabf846720f5cb18f248666fec631e5e1e66009ce3710ceea5b1ad13` +
        //sequence
        'fffffffd' +
        //output count
        '01' +
        // value in satoshis (Int64LE) = 0x015f90 = 90000
        '905f010000000000' +
        // scriptPubkey length
        '19' +
        // scriptPubkey
        `${payment.output?.toString('hex')}` +
        // locktime
        '00000000',
      'hex'
    );
    const txHash = bitcoin.crypto.hash256(nonWitnessUtxo).toString('hex');
    const inputs = [
      {
        txHash: Buffer.from(txHash, 'hex').reverse().toString('hex'),
        txIndex: 0,
        value: 90000,
        sequence: 0xfffffffd,
        addressIndex: 0,
      },
    ];

    const options: signUSDTTxType = {
      transport,
      appId: props.appId,
      appPrivateKey: props.appPrivateKey,
      scriptType: ScriptType.P2PKH,
      value: amount.toString(),
      inputs: inputs.map((i) => ({
        preTxHash: i.txHash,
        preIndex: i.txIndex,
        preValue: i.value.toString(),
        sequence: i.sequence,
        addressIndex: i.addressIndex,
      })),
      output: {
        address: toAddress,
        value: fund.toString(),
      },
      version: 2,
    };

    const signature = await btc.signUSDTTransaction(options);
    const sighashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_ANYONECANPAY;

    const signer = ECPair.fromPrivateKey(privateKey, { network });
    const psbt = new bitcoin.Psbt();
    psbt.setVersion(2);
    psbt.setLocktime(0);
    psbt.addInputs(
      inputs.map((i) => ({
        hash: i.txHash,
        index: i.txIndex,
        sequence: i.sequence,
        nonWitnessUtxo,
        sighashType,
      }))
    );
    psbt.addOutput({
      address: toAddress,
      value: fund,
    });
    const usdtInfo = [
      '6f6d6e69',
      /*transaction version=*/ '0000',
      /*transaction type=*/ '0000',
      /*omni token type=*/ '0000001f',
      amount.toString(16).padStart(16, '0'),
    ].join('');
    const data = Buffer.from(usdtInfo, 'hex');
    const omniOutput = bitcoin.script.compile([bitcoin.opcodes.OP_RETURN, data]);
    psbt.addOutput({
      script: omniOutput,
      value: 0,
    });
    psbt.signAllInputs(signer, [sighashType]);
    psbt.finalizeAllInputs();

    expect(signature).toEqual(psbt.extractTransaction().toHex());

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('BTC')
      .messagePage('USDT')
      .addressPage(toAddress)
      .amountPage(amount / 1e8)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it('BTC test sign P2PKH USDT transaction', async () => {
    const accountNode = wallet.derivePath(`m/44'/0'/0'/0/0`);
    const privateKey = accountNode.privateKey;
    const publicKey = await accountNode.getPublicKey();

    const toAddress = '3QWBFHqJSjkcDcokSozVxUbtMaRJ59xRv5';
    const amount = +105 * 1e8;
    const network = bitcoin.networks.bitcoin;
    // Omni will need at least 546 satoshis to complete the transaction.
    const fund = 546;
    const payment = bitcoin.payments.p2pkh({
      pubkey: publicKey,
      network,
    });

    const nonWitnessUtxo = Buffer.from(
      //version
      '02000000' +
        //input count
        '01' +
        //tx hash
        'cebc7aa4e89c0e34598a0d2758fc96d8af2fda494dc4c00b12929ae1649e3847' +
        //tx index
        '00000000' +
        //script sig size
        '6b' +
        //signature size
        '48' +
        //signature
        `3045022100c86e9a111afc90f64b4904bd609e9eaed80d48ca17c162b1aca0a788ac3526f002207bb79b60d4fc6526329bf18a77135dc5660209e761da46e1c2f1152ec013215801` +
        //script
        `210211755115eabf846720f5cb18f248666fec631e5e1e66009ce3710ceea5b1ad13` +
        //sequence
        'fffffffd' +
        //output count
        '01' +
        // value in satoshis (Int64LE) = 0x015f90 = 90000
        '905f010000000000' +
        // scriptPubkey length
        '19' +
        // scriptPubkey
        `${payment.output?.toString('hex')}` +
        // locktime
        '00000000',
      'hex'
    );
    const txHash = bitcoin.crypto.hash256(nonWitnessUtxo).toString('hex');
    const inputs = [
      {
        txHash: Buffer.from(txHash, 'hex').reverse().toString('hex'),
        txIndex: 0,
        value: 90000,
        sequence: 0xfffffffd,
        addressIndex: 0,
      },
    ];

    const fee = calculateSegwitFee(ECPair, inputs, network);
    const change = inputs.reduce((acc, i) => acc + i.value, 0) - fund - fee;

    const options: signUSDTTxType = {
      transport,
      appId: props.appId,
      appPrivateKey: props.appPrivateKey,
      scriptType: ScriptType.P2PKH,
      value: amount.toString(),
      inputs: inputs.map((i) => ({
        preTxHash: i.txHash,
        preIndex: i.txIndex,
        preValue: i.value.toString(),
        sequence: i.sequence,
        addressIndex: i.addressIndex,
      })),
      output: {
        address: toAddress,
        value: fund.toString(),
      },
      change: {
        addressIndex: 0,
        value: change.toString(),
      },
      version: 2,
    };

    const signature = await btc.signUSDTTransaction(options);
    const sighashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_ANYONECANPAY;

    const signer = ECPair.fromPrivateKey(privateKey, { network });
    const psbt = new bitcoin.Psbt();
    psbt.setVersion(2);
    psbt.setLocktime(0);
    psbt.addInputs(
      inputs.map((i) => ({
        hash: i.txHash,
        index: i.txIndex,
        sequence: i.sequence,
        nonWitnessUtxo,
        sighashType,
      }))
    );
    psbt.addOutput({
      address: toAddress,
      value: fund,
    });
    const usdtInfo = [
      '6f6d6e69',
      /*transaction version=*/ '0000',
      /*transaction type=*/ '0000',
      /*omni token type=*/ '0000001f',
      amount.toString(16).padStart(16, '0'),
    ].join('');
    const data = Buffer.from(usdtInfo, 'hex');
    const omniOutput = bitcoin.script.compile([bitcoin.opcodes.OP_RETURN, data]);
    psbt.addOutput({
      script: omniOutput,
      value: 0,
    });
    psbt.addOutput({
      address: payment.address!,
      value: change,
    });
    psbt.signAllInputs(signer, [sighashType]);
    psbt.finalizeAllInputs();

    expect(signature).toEqual(psbt.extractTransaction().toHex());

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('BTC')
      .messagePage('USDT')
      .addressPage(toAddress)
      .amountPage(amount / 1e8)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it('BTC test sign P2SH_P2WPKH without change transaction', async () => {
    const network = bitcoin.networks.bitcoin;
    const toAddress = '1KRMKfeZcmosxALVYESdPNez1AP1mEtywp';
    const amount = 80000;
    const inputs = [
      {
        txHash: 'cebc7aa4e89c0e34598a0d2758fc96d8af2fda494dc4c00b12929ae1649e3847',
        txIndex: 0,
        value: 90000,
        sequence: 0xfffffffd,
        addressIndex: 0,
      },
    ];

    const options: signTxType = {
      transport,
      appId: props.appId,
      appPrivateKey: props.appPrivateKey,
      scriptType: ScriptType.P2SH_P2WPKH,
      inputs: inputs.map((i) => ({
        preTxHash: i.txHash,
        preIndex: i.txIndex,
        preValue: '' + i.value,
        sequence: i.sequence,
        addressIndex: i.addressIndex,
      })),
      output: {
        value: amount.toString(),
        address: toAddress,
      },
      version: 2,
    };

    const signature = await btc.signTransaction(options);

    const accountNode = wallet.derivePath(`m/44'/0'/0'/0/0`);
    const privateKey = accountNode.privateKey;
    const publicKey = await accountNode.getPublicKey();
    const payment = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({
        pubkey: publicKey,
        network,
      }),
      network,
    });

    const signer = ECPair.fromPrivateKey(privateKey, { network });
    const psbt = new bitcoin.Psbt();
    psbt.setVersion(2);
    psbt.setLocktime(0);
    psbt.addInputs(
      inputs.map((i) => ({
        hash: i.txHash,
        index: i.txIndex,
        sequence: i.sequence,
        witnessUtxo: {
          script: payment.output!,
          value: i.value,
        },
        redeemScript: payment.redeem?.output,
      }))
    );
    psbt.addOutput({
      address: toAddress,
      value: amount,
    });
    psbt.signAllInputs(signer);
    psbt.finalizeAllInputs();

    expect(signature).toEqual(psbt.extractTransaction().toHex());

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('BTC')
      .addressPage(toAddress)
      .amountPage(amount / 1e8)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it('BTC test sign P2SH_P2WPKH transaction', async () => {
    const network = bitcoin.networks.bitcoin;
    const toAddress = '1KRMKfeZcmosxALVYESdPNez1AP1mEtywp';
    const amount = 80000;
    const inputs = [
      {
        txHash: 'cebc7aa4e89c0e34598a0d2758fc96d8af2fda494dc4c00b12929ae1649e3847',
        txIndex: 0,
        value: 90000,
        sequence: 0xfffffffd,
        addressIndex: 0,
      },
    ];
    const fee = calculateSegwitFee(ECPair, inputs, network);
    const change = inputs.reduce((acc, i) => acc + i.value, 0) - amount - fee;

    const options: signTxType = {
      transport,
      appId: props.appId,
      appPrivateKey: props.appPrivateKey,
      scriptType: ScriptType.P2SH_P2WPKH,
      inputs: inputs.map((i) => ({
        preTxHash: i.txHash,
        preIndex: i.txIndex,
        preValue: '' + i.value,
        sequence: i.sequence,
        addressIndex: i.addressIndex,
      })),
      output: {
        value: amount.toString(),
        address: toAddress,
      },
      change: {
        addressIndex: 0,
        value: change.toString(),
      },
      version: 2,
    };

    const signature = await btc.signTransaction(options);

    const accountNode = wallet.derivePath(`m/44'/0'/0'/0/0`);
    const privateKey = accountNode.privateKey;
    const publicKey = await accountNode.getPublicKey();
    const payment = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({
        pubkey: publicKey,
        network,
      }),
      network,
    });

    const signer = ECPair.fromPrivateKey(privateKey, { network });
    const psbt = new bitcoin.Psbt();
    psbt.setVersion(2);
    psbt.setLocktime(0);
    psbt.addInputs(
      inputs.map((i) => ({
        hash: i.txHash,
        index: i.txIndex,
        sequence: i.sequence,
        witnessUtxo: {
          script: payment.output!,
          value: i.value,
        },
        redeemScript: payment.redeem?.output,
      }))
    );
    psbt.addOutput({
      address: toAddress,
      value: amount,
    });
    psbt.addOutput({
      address: payment.address!,
      value: change,
    });
    psbt.signAllInputs(signer);
    psbt.finalizeAllInputs();

    expect(signature).toEqual(psbt.extractTransaction().toHex());

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('BTC')
      .addressPage(toAddress)
      .amountPage(amount / 1e8)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it('BTC test sign P2SH_P2WPKH USDT without change transaction', async () => {
    const toAddress = '3QWBFHqJSjkcDcokSozVxUbtMaRJ59xRv5';
    const amount = +105 * 1e8;
    const network = bitcoin.networks.bitcoin;
    // Omni will need at least 546 satoshis to complete the transaction.
    const fund = 546;
    const inputs = [
      {
        txHash: 'a2ce1ce33ed90ea48d2080239b16a7ed6017ff9c44ea9048caa10faf31561b44',
        txIndex: 0,
        value: 214150,
        sequence: 0xfffffffd,
        addressIndex: 0,
      },
      {
        txHash: 'e9489031d0314707e390226c07d96c5353a21c0dda66339e28126b9667242390',
        txIndex: 0,
        value: 214150,
        sequence: 0xfffffffd,
        addressIndex: 0,
      },
    ];

    const options: signUSDTTxType = {
      transport,
      appId: props.appId,
      appPrivateKey: props.appPrivateKey,
      scriptType: ScriptType.P2SH_P2WPKH,
      value: amount.toString(),
      inputs: inputs.map((i) => ({
        preTxHash: i.txHash,
        preIndex: i.txIndex,
        preValue: i.value.toString(),
        sequence: i.sequence,
        addressIndex: i.addressIndex,
      })),
      output: {
        value: fund.toString(),
        address: toAddress,
      },
      version: 2,
    };

    const signature = await btc.signUSDTTransaction(options);

    const accountNode = wallet.derivePath(`m/44'/0'/0'/0/0`);
    const privateKey = accountNode.privateKey;
    const publicKey = await accountNode.getPublicKey();
    const payment = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({
        pubkey: publicKey,
        network,
      }),
      network,
    });

    const signer = ECPair.fromPrivateKey(privateKey, { network });
    const psbt = new bitcoin.Psbt();
    psbt.setVersion(2);
    psbt.setLocktime(0);
    psbt.addInputs(
      inputs.map((i) => ({
        hash: i.txHash,
        index: i.txIndex,
        sequence: i.sequence,
        witnessUtxo: {
          script: payment.output!,
          value: i.value,
        },
        redeemScript: payment.redeem?.output,
      }))
    );
    psbt.addOutput({
      address: toAddress,
      value: fund,
    });
    const usdtInfo = [
      '6f6d6e69',
      /*transaction version=*/ '0000',
      /*transaction type=*/ '0000',
      /*omni token type=*/ '0000001f',
      amount.toString(16).padStart(16, '0'),
    ].join('');
    const data = Buffer.from(usdtInfo, 'hex');
    const omniOutput = bitcoin.script.compile([bitcoin.opcodes.OP_RETURN, data]);
    psbt.addOutput({
      script: omniOutput,
      value: 0,
    });
    psbt.signAllInputs(signer);
    psbt.finalizeAllInputs();

    expect(signature).toEqual(psbt.extractTransaction().toHex());

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('BTC')
      .messagePage('USDT')
      .addressPage(toAddress)
      .amountPage(amount / 1e8)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });

  it('BTC test sign P2SH_P2WPKH USDT transaction', async () => {
    const toAddress = '3QWBFHqJSjkcDcokSozVxUbtMaRJ59xRv5';
    const amount = +105 * 1e8;
    const network = bitcoin.networks.bitcoin;
    // Omni will need at least 546 satoshis to complete the transaction.
    const fund = 546;
    const inputs = [
      {
        txHash: 'a2ce1ce33ed90ea48d2080239b16a7ed6017ff9c44ea9048caa10faf31561b44',
        txIndex: 0,
        value: 214150,
        sequence: 0xfffffffd,
        addressIndex: 0,
      },
    ];

    const fee = calculateSegwitFee(ECPair, inputs, network);
    const change = inputs.reduce((acc, i) => acc + i.value, 0) - fee - fund;

    const options: signUSDTTxType = {
      transport,
      appId: props.appId,
      appPrivateKey: props.appPrivateKey,
      scriptType: ScriptType.P2SH_P2WPKH,
      value: amount.toString(),
      inputs: inputs.map((i) => ({
        preTxHash: i.txHash,
        preIndex: i.txIndex,
        preValue: i.value.toString(),
        sequence: i.sequence,
        addressIndex: i.addressIndex,
      })),
      output: {
        value: fund.toString(),
        address: toAddress,
      },
      change: {
        addressIndex: 0,
        value: change.toString(),
      },
      version: 2,
    };

    const signature = await btc.signUSDTTransaction(options);

    const accountNode = wallet.derivePath(`m/44'/0'/0'/0/0`);
    const privateKey = accountNode.privateKey;
    const publicKey = await accountNode.getPublicKey();
    const payment = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({
        pubkey: publicKey,
        network,
      }),
      network,
    });

    const signer = ECPair.fromPrivateKey(privateKey, { network });
    const psbt = new bitcoin.Psbt();
    psbt.setVersion(2);
    psbt.setLocktime(0);
    psbt.addInputs(
      inputs.map((i) => ({
        hash: i.txHash,
        index: i.txIndex,
        sequence: i.sequence,
        witnessUtxo: {
          script: payment.output!,
          value: i.value,
        },
        redeemScript: payment.redeem?.output,
      }))
    );
    psbt.addOutput({
      address: toAddress,
      value: fund,
    });
    const usdtInfo = [
      '6f6d6e69',
      /*transaction version=*/ '0000',
      /*transaction type=*/ '0000',
      /*omni token type=*/ '0000001f',
      amount.toString(16).padStart(16, '0'),
    ].join('');
    const data = Buffer.from(usdtInfo, 'hex');
    const omniOutput = bitcoin.script.compile([bitcoin.opcodes.OP_RETURN, data]);
    psbt.addOutput({
      script: omniOutput,
      value: 0,
    });
    psbt.addOutput({
      address: payment.address!,
      value: change,
    });
    psbt.signAllInputs(signer);
    psbt.finalizeAllInputs();

    expect(signature).toEqual(psbt.extractTransaction().toHex());

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txDetail = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('BTC')
      .messagePage('USDT')
      .addressPage(toAddress)
      .amountPage(amount / 1e8)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();

    expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
  });
});
