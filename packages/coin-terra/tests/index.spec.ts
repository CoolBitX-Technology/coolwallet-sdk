import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, getTxDetail, DisplayBuilder } from '@coolwallet/testing-library';
import Terra from '../src';
import { CHAIN_ID, TX_TYPE, SignDataType } from '../src/config/types';
import { DENOMTYPE } from '../src/config/denomType';
import { TOKENTYPE } from '../src/config/tokenType';
import {
  LCDClient,
  Fee,
  MnemonicKey,
  Coin,
  MsgSend,
  MsgDelegate,
  MsgUndelegate,
  MsgWithdrawDelegatorReward,
  MsgExecuteContract,
} from '@terra-money/terra.js';

const crypto = require('crypto');

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const coinTerra = new Terra();

const mnemonic = 'catalog inmate announce liar young avocado oval depth tag around sting soda';

describe('Test Terra SDK', () => {
  const denomArray = Object.values(DENOMTYPE);
  const tokenArray = Object.values(TOKENTYPE);
  const getRandInt = (max: number) => Math.floor(Math.random() * max);
  const getRandDenom = () => denomArray[getRandInt(denomArray.length)];
  const getRandToken = () => tokenArray[getRandInt(tokenArray.length)];
  const getRandSequence = () => (getRandInt(1000) + 1).toString();
  const getRandAccount = () => (getRandInt(1000000) + 1).toString();
  const getRandWallet = () => 'terra1' + crypto.randomBytes(19).toString('hex');
  const getRandValidator = () => 'terravaloper1' + crypto.randomBytes(19).toString('hex');

  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let walletAddress = '';
  let signTxData: SignDataType = {
    addressIndex: 0,
    confirmCB: undefined,
    authorizedCB: undefined,
  };

  const mainnet = new LCDClient({
    URL: 'https://lcd.terra.dev',
    chainID: 'columbus-5',
  });
  const mk = new MnemonicKey({ mnemonic });
  const wallet = mainnet.wallet(mk);

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
    signTxData.transport = transport;
    signTxData.appPrivateKey = props.appPrivateKey;
    signTxData.appId = props.appId;
    const address = await coinTerra.getAddress(transport, props.appPrivateKey, props.appId, 0);
    walletAddress = address;
  });

  it('Test Get Address', async () => {
    expect(walletAddress).toEqual(wallet.key.accAddress);
  });

  it('Test Normal Transfer', async () => {
    const denom = getRandDenom();
    const feeDenom = getRandDenom();
    const transaction = {
      chainId: CHAIN_ID.MAIN,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      fromAddress: walletAddress,
      toAddress: getRandWallet(),
      amount: getRandInt(1000000000) + 1,
      denom,
      feeAmount: getRandInt(90000) + 1,
      feeDenom,
      gas: getRandInt(85000) + 1,
      memo: 'test signature',
    };
    signTxData.txType = TX_TYPE.SEND;
    signTxData.transaction = transaction;
    const signedTx = await coinTerra.signTransaction(signTxData);

    const send_tx = new MsgSend(wallet.key.accAddress, transaction.toAddress, { [denom.unit]: transaction.amount });
    const sendOpt = {
      msgs: [send_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.gas, { [feeDenom.unit]: transaction.feeAmount }, '', ''),
    };
    const signedTxSDK = mainnet.tx.encode(await wallet.createAndSignTx(sendOpt));

    try {
      expect(signedTx).toEqual(signedTxSDK);
    } catch (e) {
      console.error('Test Normal Transfer params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage(coinTerra.constructor.name)
      .messagePage(transaction.denom.name)
      .addressPage(transaction.toAddress.toLowerCase())
      .amountPage(+transaction.amount/1000000)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Delegate', async () => {
    const feeDenom = getRandDenom();
    const transaction = {
      chainId: CHAIN_ID.MAIN,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      delegatorAddress: walletAddress,
      validatorAddress: getRandValidator(),
      amount: getRandInt(1000000) + 1,
      feeAmount: getRandInt(70000000) + 1,
      gas: getRandInt(520000) + 1,
      feeDenom,
      memo: 'test delegate',
    };
    signTxData.txType = TX_TYPE.DELEGATE;
    signTxData.transaction = transaction;
    const signedTx = await coinTerra.signTransaction(signTxData);

    const delegate_tx = new MsgDelegate(
      wallet.key.accAddress,
      transaction.validatorAddress,
      new Coin('uluna', transaction.amount.toString())
    );
    const delegateOpt = {
      msgs: [delegate_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.gas, { [feeDenom.unit]: transaction.feeAmount }, '', ''),
    };
    const signedTxSDK = mainnet.tx.encode(await wallet.createAndSignTx(delegateOpt));

    try {
      expect(signedTx).toEqual(signedTxSDK);
    } catch (e) {
      console.error('Test Delegate params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage(coinTerra.constructor.name)
      .messagePage('LUNA')
      .messagePage('Delgt')
      .addressPage(transaction.validatorAddress.toLowerCase())
      .amountPage(+transaction.amount/1000000)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Undelegate', async () => {
    const feeDenom = getRandDenom();
    const transaction = {
      chainId: CHAIN_ID.MAIN,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      delegatorAddress: walletAddress,
      validatorAddress: getRandValidator(),
      amount: getRandInt(1000000) + 1,
      feeAmount: getRandInt(700000) + 1,
      feeDenom,
      gas: getRandInt(550000) + 1,
      memo: 'test undelegate',
    };
    signTxData.txType = TX_TYPE.UNDELEGATE;
    signTxData.transaction = transaction;
    const signedTx = await coinTerra.signTransaction(signTxData);

    const undelegate_tx = new MsgUndelegate(
      wallet.key.accAddress,
      transaction.validatorAddress,
      new Coin('uluna', transaction.amount.toString())
    );
    const undelegateOpt = {
      msgs: [undelegate_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.gas, { [feeDenom.unit]: transaction.feeAmount }, '', ''),
    };
    const signedTxSDK = mainnet.tx.encode(await wallet.createAndSignTx(undelegateOpt));

    try {
      expect(signedTx).toEqual(signedTxSDK);
    } catch (e) {
      console.error('Test Undelegate params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage(coinTerra.constructor.name)
      .messagePage('LUNA')
      .messagePage('UnDel')
      .addressPage(transaction.validatorAddress.toLowerCase())
      .amountPage(+transaction.amount/1000000)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Withdraw', async () => {
    const feeDenom = getRandDenom();
    const transaction = {
      chainId: CHAIN_ID.MAIN,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      delegatorAddress: walletAddress,
      validatorAddress: getRandValidator(),
      feeAmount: getRandInt(1330000000) + 1,
      feeDenom,
      gas: getRandInt(400000) + 1,
      memo: 'test withdraw',
    };
    signTxData.txType = TX_TYPE.WITHDRAW;
    signTxData.transaction = transaction;
    const signedTx = await coinTerra.signTransaction(signTxData);

    const withdraw_tx = new MsgWithdrawDelegatorReward(wallet.key.accAddress, transaction.validatorAddress);
    const withdrawOpt = {
      msgs: [withdraw_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.gas, { [feeDenom.unit]: transaction.feeAmount }, '', ''),
    };
    const signedTxSDK = mainnet.tx.encode(await wallet.createAndSignTx(withdrawOpt));

    try {
      expect(signedTx).toEqual(signedTxSDK);
    } catch (e) {
      console.error('Test Withdraw params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage(coinTerra.constructor.name)
      .messagePage('LUNA')
      .messagePage('Reward')
      .addressPage(transaction.validatorAddress.toLowerCase())
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Smart Contract: Luna to bLuna Swap', async () => {
    const denom = getRandDenom();
    const feeDenom = getRandDenom();
    const executeMsgObj = {
      swap: {
        offer_asset: {
          info: {
            native_token: {
              denom: denom.unit,
            },
          },
          amount: (getRandInt(345000) + 1).toString(),
        },
      },
    };
    const transaction = {
      chainId: CHAIN_ID.MAIN,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      senderAddress: walletAddress,
      contractAddress: getRandWallet(),
      execute_msg: JSON.stringify(executeMsgObj),
      funds: {
        amount: parseInt(executeMsgObj.swap.offer_asset.amount),
        denom,
      },
      feeAmount: getRandInt(200000) + 1,
      feeDenom,
      gas: getRandInt(250000) + 1,
      memo: 'Swap test',
    };
    signTxData.txType = TX_TYPE.SMART;
    signTxData.transaction = transaction;
    const signedTx = await coinTerra.signTransaction(signTxData);

    const smartSwap_tx = new MsgExecuteContract(
      wallet.key.accAddress,
      transaction.contractAddress,
      JSON.stringify(executeMsgObj),
      { [denom.unit]: transaction.funds.amount }
    );
    const smartSwapOpt = {
      msgs: [smartSwap_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.gas, { [feeDenom.unit]: transaction.feeAmount }, '', ''),
    };
    const signedTxSDK = mainnet.tx.encode(await wallet.createAndSignTx(smartSwapOpt));

    try {
      expect(signedTx).toEqual(signedTxSDK);
    } catch (e) {
      console.error('Test Smart Contract: Luna to bLuna Swap params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage(coinTerra.constructor.name)
      .wrapPage('SMART', '')
      .addressPage(transaction.contractAddress.toLowerCase())
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Send CW20 Transfer', async () => {
    const token = getRandToken();
    const feeDenom = getRandDenom();
    const executeMsgObj = {
      transfer: {
        amount: (getRandInt(12000000) + 1).toString(),
        recipient: getRandWallet(),
      },
    };
    const transaction = {
      chainId: CHAIN_ID.MAIN,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      senderAddress: walletAddress,
      contractAddress: token.contractAddress,
      execute_msg: executeMsgObj,
      option: {
        info: {
          symbol: token.symbol,
          decimals: token.unit,
        },
      },
      feeAmount: getRandInt(5000000) + 1,
      feeDenom,
      gas: getRandInt(120000) + 1,
      memo: 'Send cw20 test',
    };
    signTxData.txType = TX_TYPE.CW20;
    signTxData.transaction = transaction;
    const signedTx = await coinTerra.signTransaction(signTxData);

    const cw20_tx = new MsgExecuteContract(
      wallet.key.accAddress,
      transaction.contractAddress,
      executeMsgObj
    );
    const cw20Opt = {
      msgs: [cw20_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.gas, { [feeDenom.unit]: transaction.feeAmount }, '', ''),
    };
    const signedTxSDK = mainnet.tx.encode(await wallet.createAndSignTx(cw20Opt));

    try {
      expect(signedTx).toEqual(signedTxSDK);
    } catch (e) {
      console.error('Test Send CW20 Transfer params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage(coinTerra.constructor.name)
      .messagePage(token.symbol)
      .addressPage(executeMsgObj.transfer.recipient.toLowerCase())
      .amountPage(+executeMsgObj.transfer.amount/1000000)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });
});
