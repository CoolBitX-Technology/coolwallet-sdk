import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, getTxDetail, DisplayBuilder, CURVE, HDWallet } from '@coolwallet/testing-library';
import * as bip39 from 'bip39';
import crypto from 'node:crypto';
import { Account } from 'iotex-antenna/lib/account/account.js';
import { Envelop, SealedEnvelop } from 'iotex-antenna/lib/action/envelop.js';
import BigNumber from 'bignumber.js';
import Iotx, { Options } from '../src';
import * as utils from '../src/utils';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const iotx = new Iotx();
const mnemonic = bip39.generateMnemonic();

describe('Test IOTX SDK', () => {
  const getRandInt = (max: number) => Math.floor(Math.random() * max);
  const getRandNonce = () => getRandInt(100) + 1;
  const getRandGasLimit = () => getRandInt(9000) + 9000;
  const getRandGasPrice = () => new BigNumber((getRandInt(100) + 1) / 10).shiftedBy(18).toFixed();
  const getRandTokenVal = () => (getRandInt(10000) + 1) / 100;
  const getRandWallet = () => Account.fromPrivateKey(crypto.randomBytes(66).toString('hex')).address;
  const getRandCandidate = () => 'robotbp' + String(getRandInt(1000) + 1).padStart(5, '0');
  const getRandTokenName = (length: number) =>
    Math.random()
      .toString(36)
      .toUpperCase()
      .replace(/[0-9O]/g, '')
      .substring(1, length + 1);

  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let walletAddress = '';
  const options: Options = {
    confirmCB: undefined,
    authorizedCB: undefined,
  };
  let antenaAcc: Account = null;

  const wallet = new HDWallet(CURVE.SECP256K1);
  const addressIndex = getRandInt(10);

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
    options.transport = transport;
    options.appPrivateKey = props.appPrivateKey;
    options.appId = props.appId;
    const address = await iotx.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
    walletAddress = address;

    await wallet.setMnemonic(mnemonic);
    const privateKey = await wallet.derivePath(`44'/304'/0'/0/${addressIndex}`).getPrivateKeyHex();
    antenaAcc = Account.fromPrivateKey(privateKey);
  });

  it('Test Get Address', async () => {
    expect(walletAddress).toEqual(antenaAcc.address);
  });

  it('Test Normal Transfer', async () => {
    const rawAmount = getRandTokenVal();
    const transaction = {
      addressIndex,
      nonce: getRandNonce(),
      gasLimit: getRandGasLimit(),
      gasPrice: getRandGasPrice(),
      amount: new BigNumber(rawAmount).shiftedBy(18).toFixed(),
      recipient: getRandWallet(),
      payload: crypto.randomBytes(128).toString('hex'),
    };
    const signedTx = await iotx.signTransaction(transaction, options);

    const envelop = new Envelop(
      1,
      transaction.nonce.toString(),
      transaction.gasLimit.toString(),
      transaction.gasPrice.toString()
    );
    envelop.transfer = {
      amount: transaction.amount.toString(),
      recipient: transaction.recipient,
      payload: Buffer.from(transaction.payload, 'hex'),
    };
    const res = SealedEnvelop.sign(antenaAcc.privateKey, antenaAcc.publicKey, envelop);

    try {
      expect(signedTx).toEqual(Buffer.from(res.bytestream()).toString('hex'));
    } catch (e) {
      console.error('Test Normal Transfer params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('IOTX')
      .wrapPage('TRANSFER', '')
      .addressPage(transaction.recipient.toLowerCase())
      .amountPage(+rawAmount)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Smart Contract', async () => {
    const rawAmount = getRandTokenVal();
    const transaction = {
      addressIndex,
      nonce: getRandNonce(),
      gasLimit: getRandGasLimit(),
      gasPrice: getRandGasPrice(),
      amount: new BigNumber(rawAmount).shiftedBy(18).toFixed(),
      contract: getRandWallet(),
      data: crypto.randomBytes(128).toString('hex'),
    };
    const signedTx = await iotx.signExecution(transaction, options);

    const envelop = new Envelop(
      1,
      transaction.nonce.toString(),
      transaction.gasLimit.toString(),
      transaction.gasPrice.toString()
    );
    envelop.execution = {
      amount: transaction.amount.toString(),
      contract: transaction.contract,
      data: Buffer.from(transaction.data, 'hex'),
    };
    const res = SealedEnvelop.sign(antenaAcc.privateKey, antenaAcc.publicKey, envelop);

    try {
      expect(signedTx).toEqual(Buffer.from(res.bytestream()).toString('hex'));
    } catch (e) {
      console.error('Test Smart Contract params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('IOTX')
      .wrapPage('SMART', '')
      .addressPage(transaction.contract.toLowerCase())
      .amountPage(+rawAmount)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test XRC20 Token', async () => {
    const rawAmount = getRandTokenVal();
    const transaction = {
      addressIndex,
      nonce: getRandNonce(),
      gasLimit: getRandGasLimit(),
      gasPrice: getRandGasPrice(),
      amount: new BigNumber(rawAmount).shiftedBy(18).toFixed(),
      recipient: getRandWallet(),
      tokenDecimals: 18,
      tokenSymbol: getRandTokenName(getRandInt(2) + 3),
      tokenAddress: getRandWallet()
    };
    const signedTx = await iotx.signXRC20Token(transaction, options);
    const envelop = new Envelop(
      1,
      transaction.nonce.toString(),
      transaction.gasLimit.toString(),
      transaction.gasPrice.toString()
    );
    transaction.data = utils.encodeXRC20TokenInfo(transaction.recipient, transaction.amount);//.toString('hex');
    envelop.execution = {
      amount: '0',//transaction.amount.toString(),
      contract: transaction.tokenAddress,
      data: transaction.data,
    };
    const res = SealedEnvelop.sign(antenaAcc.privateKey, antenaAcc.publicKey, envelop);

    try {
      expect(signedTx).toEqual(Buffer.from(res.bytestream()).toString('hex'));
    } catch (e) {
      console.error('Test XRC20 Token params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('IOTX')
      .messagePage('@'+transaction.tokenSymbol)
      .addressPage(transaction.recipient.toLowerCase())
      .amountPage(+rawAmount)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Stake Create', async () => {
    const rawAmount = getRandTokenVal();
    const transaction = {
      addressIndex,
      nonce: getRandNonce(),
      gasLimit: getRandGasLimit(),
      gasPrice: getRandGasPrice(),
      candidateName: getRandCandidate(),
      amount: new BigNumber(rawAmount).shiftedBy(18).toFixed(),
      duration: getRandInt(30) + 1,
      isAuto: getRandInt(1) === 0,
      payload: crypto.randomBytes(128).toString('hex'),
    };
    const signedTx = await iotx.signStakeCreate(transaction, options);

    const envelop = new Envelop(
      1,
      transaction.nonce.toString(),
      transaction.gasLimit.toString(),
      transaction.gasPrice.toString()
    );
    envelop.stakeCreate = {
      candidateName: transaction.candidateName,
      stakedAmount: transaction.amount.toString(),
      stakedDuration: transaction.duration,
      autoStake: transaction.isAuto,
      payload: Buffer.from(transaction.payload, 'hex'),
    };
    const res = SealedEnvelop.sign(antenaAcc.privateKey, antenaAcc.publicKey, envelop);

    try {
      expect(signedTx).toEqual(Buffer.from(res.bytestream()).toString('hex'));
    } catch (e) {
      console.error('Test Stake Create params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('IOTX')
      .wrapPage('CREATE', 'STAKE')
      .amountPage(+rawAmount)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Stake Unstake', async () => {
    const transaction = {
      addressIndex,
      nonce: getRandNonce(),
      gasLimit: getRandGasLimit(),
      gasPrice: getRandGasPrice(),
      bucketIndex: getRandInt(100) + 1,
      payload: crypto.randomBytes(128).toString('hex'),
    };
    const signedTx = await iotx.signStakeUnstake(transaction, options);

    const envelop = new Envelop(
      1,
      transaction.nonce.toString(),
      transaction.gasLimit.toString(),
      transaction.gasPrice.toString()
    );
    envelop.stakeUnstake = {
      bucketIndex: transaction.bucketIndex,
      payload: Buffer.from(transaction.payload, 'hex'),
    };
    const res = SealedEnvelop.sign(antenaAcc.privateKey, antenaAcc.publicKey, envelop);

    try {
      expect(signedTx).toEqual(Buffer.from(res.bytestream()).toString('hex'));
    } catch (e) {
      console.error('Test Stake Unstake params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('IOTX')
      .wrapPage('UNSTAKE', '')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Stake Withdraw', async () => {
    const transaction = {
      addressIndex,
      nonce: getRandNonce(),
      gasLimit: getRandGasLimit(),
      gasPrice: getRandGasPrice(),
      bucketIndex: getRandInt(100) + 1,
      payload: crypto.randomBytes(128).toString('hex'),
    };
    const signedTx = await iotx.signStakeWithdraw(transaction, options);

    const envelop = new Envelop(
      1,
      transaction.nonce.toString(),
      transaction.gasLimit.toString(),
      transaction.gasPrice.toString()
    );
    envelop.stakeWithdraw = {
      bucketIndex: transaction.bucketIndex,
      payload: Buffer.from(transaction.payload, 'hex'),
    };
    const res = SealedEnvelop.sign(antenaAcc.privateKey, antenaAcc.publicKey, envelop);

    try {
      expect(signedTx).toEqual(Buffer.from(res.bytestream()).toString('hex'));
    } catch (e) {
      console.error('Test Stake Withdraw params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('IOTX')
      .wrapPage('WITHDRAW', 'STAKE')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Stake Deposit', async () => {
    const rawAmount = getRandTokenVal();
    const transaction = {
      addressIndex,
      nonce: getRandNonce(),
      gasLimit: getRandGasLimit(),
      gasPrice: getRandGasPrice(),
      amount: new BigNumber(rawAmount).shiftedBy(18).toFixed(),
      bucketIndex: getRandInt(100) + 1,
      payload: crypto.randomBytes(128).toString('hex'),
    };
    const signedTx = await iotx.signStakeDeposit(transaction, options);

    const envelop = new Envelop(
      1,
      transaction.nonce.toString(),
      transaction.gasLimit.toString(),
      transaction.gasPrice.toString()
    );
    envelop.stakeAddDeposit = {
      bucketIndex: transaction.bucketIndex,
      amount: transaction.amount.toString(),
      payload: Buffer.from(transaction.payload, 'hex'),
    };
    const res = SealedEnvelop.sign(antenaAcc.privateKey, antenaAcc.publicKey, envelop);
    
    try {
      expect(signedTx).toEqual(Buffer.from(res.bytestream()).toString('hex'));
    } catch (e) {
      console.error('Test Stake Deposit params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('IOTX')
      .wrapPage('DEPOSIT', 'STAKE')
      .amountPage(+rawAmount)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });
});
