import crypto from 'node:crypto';
import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, getTxDetail, DisplayBuilder } from '@coolwallet/testing-library';
import Terra, { DENOMTYPE, DENOMTYPE_CLASSIC, TOKENTYPE, CHAIN_ID, SignDataType } from '../src';
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
import { txParamParser } from './utils';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const coinTerra = new Terra();

const mnemonic = 'catalog inmate announce liar young avocado oval depth tag around sting soda';

describe('Test Terra SDK', () => {
  const denomArray = Object.values(DENOMTYPE);
  const denomClassicArray =Object.values(DENOMTYPE_CLASSIC);
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

  const chain = CHAIN_ID.MAIN;
  const mainnet = new LCDClient({
    URL: 'https://lcd.terra.dev',
    chainID: chain,
  });
  const mk = new MnemonicKey({ mnemonic });
  const wallet = mainnet.wallet(mk);

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
    const address = await coinTerra.getAddress(transport, props.appPrivateKey, props.appId, 0);
    walletAddress = address;
  });

  it('Test Get Address', async () => {
    expect(walletAddress).toEqual(wallet.key.accAddress);
  });

  it('Test Denoms', async () => {
    const denom = getRandDenom();
    const feeDenom = getRandDenom();
    const transaction = {
      chainId: chain,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      fromAddress: walletAddress,
      toAddress: getRandWallet(),
      coin: {
        denom,
        amount: getRandInt(1000000000) + 1,
      },
      fee: {
        gas_limit: getRandInt(85000) + 1,
        denom: feeDenom,
        amount: getRandInt(90000) + 1,
      },
      memo: 'test signature',
    };
    const signTxData: SignDataType = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };

    for(let i = 0, j = denomArray.length - 1; i <= j; ++i, --j) {
      signTxData.transaction.coin.denom = denomArray[i];
      signTxData.transaction.fee.denom = denomArray[j];
      try {
        await coinTerra.signTransferTransaction(signTxData);
      } catch (e) {
        console.error('Test Classic Denoms fail at: ', [denomArray[i], denomArray[j]]);
        throw e;
      }
    }
  });

  it('Test Classic Denoms', async () => {
    const denom = getRandDenom();
    const feeDenom = getRandDenom();
    const transaction = {
      chainId: chain,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      fromAddress: walletAddress,
      toAddress: getRandWallet(),
      coin: {
        denom,
        amount: getRandInt(1000000000) + 1,
      },
      fee: {
        gas_limit: getRandInt(85000) + 1,
        denom: feeDenom,
        amount: getRandInt(90000) + 1,
      },
      memo: 'test signature',
    };
    const signTxData: SignDataType = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };

    for(let i = 0; i < denomClassicArray.length; ++i) {
      signTxData.transaction.coin.denom = denomClassicArray[i];
      signTxData.transaction.fee.denom = denomClassicArray[i];
      try {
        await coinTerra.signTransferTransaction(signTxData);
      } catch (e) {
        console.error('Test Classic Denoms fail at: ', denomClassicArray[i]);
        throw e;
      }
    }
  });

  it('Test Normal Transfer', async () => {
    const denom = getRandDenom();
    const feeDenom = getRandDenom();
    const transaction = {
      chainId: chain,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      fromAddress: walletAddress,
      toAddress: getRandWallet(),
      coin: {
        denom,
        amount: getRandInt(1000000000) + 1,
      },
      fee: {
        gas_limit: getRandInt(85000) + 1,
        denom: feeDenom,
        amount: getRandInt(90000) + 1,
      },
      memo: 'test signature',
    };
    const signTxData: SignDataType = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signTransferTransaction(signTxData);

    const send_tx = new MsgSend(wallet.key.accAddress, transaction.toAddress, {
      [denom.unit]: transaction.coin.amount,
    });
    const sendOpt = {
      msgs: [send_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.fee.gas_limit, { [feeDenom.unit]: transaction.fee.amount }, '', ''),
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
      .messagePage('TERRA')
      .messagePage(transaction.coin.denom.name)
      .addressPage(transaction.toAddress.toLowerCase())
      .amountPage(+transaction.coin.amount / 1000000)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Delegate', async () => {
    const feeDenom = getRandDenom();
    const transaction = {
      chainId: chain,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      delegatorAddress: walletAddress,
      validatorAddress: getRandValidator(),
      coin: {
        amount: getRandInt(1000000) + 1,
      },
      fee: {
        gas_limit: getRandInt(520000) + 1,
        denom: feeDenom,
        amount: getRandInt(70000000) + 1,
      },
      memo: 'test delegate',
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signDelegateTransaction(signTxData);

    const delegate_tx = new MsgDelegate(
      wallet.key.accAddress,
      transaction.validatorAddress,
      new Coin('uluna', transaction.coin.amount)
    );
    const delegateOpt = {
      msgs: [delegate_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.fee.gas_limit, { [feeDenom.unit]: transaction.fee.amount }, '', ''),
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
      .messagePage('TERRA')
      .messagePage('LUNA')
      .messagePage('Delgt')
      .addressPage(transaction.validatorAddress.toLowerCase())
      .amountPage(+transaction.coin.amount / 1000000)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Undelegate', async () => {
    const feeDenom = getRandDenom();
    const transaction = {
      chainId: chain,
      accountNumber: "2343", //getRandAccount(),
      sequence: "16", //getRandSequence(),
      delegatorAddress: walletAddress,
      validatorAddress: "terravaloper1gtw2uxdkdt3tvq790ckjz8jm8qgwkdw3uptstn", //getRandValidator(),
      coin: {
        amount: 10000, //getRandInt(1000000) + 1,
      },
      fee: {
        gas_limit: 550000, //getRandInt(520000) + 1,
        denom: feeDenom,
        amount: 83000, //getRandInt(70000000) + 1,
      },
      memo: 'test undelegate',
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signUndelegateTransaction(signTxData);

    const undelegate_tx = new MsgUndelegate(
      wallet.key.accAddress,
      transaction.validatorAddress,
      new Coin('uluna', transaction.coin.amount.toString())
    );
    const undelegateOpt = {
      msgs: [undelegate_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.fee.gas_limit, { [feeDenom.unit]: transaction.fee.amount }, '', ''),
    };
    const signedTxSDK = mainnet.tx.encode(await wallet.createAndSignTx(undelegateOpt));

    console.error('TX', signedTxSDK);

    try {
      expect(signedTx).toEqual(signedTxSDK);
    } catch (e) {
      console.error('Test Undelegate params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('TERRA')
      .messagePage('LUNA')
      .messagePage('UnDel')
      .addressPage(transaction.validatorAddress.toLowerCase())
      .amountPage(+transaction.coin.amount / 1000000)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Withdraw', async () => {
    const feeDenom = getRandDenom();
    const transaction = {
      chainId: chain,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      delegatorAddress: walletAddress,
      validatorAddress: getRandValidator(),
      fee: {
        gas_limit: getRandInt(400000) + 1,
        denom: feeDenom,
        amount: getRandInt(1330000000) + 1,
      },
      memo: 'test withdraw',
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signWithdrawTransaction(signTxData);

    const withdraw_tx = new MsgWithdrawDelegatorReward(wallet.key.accAddress, transaction.validatorAddress);
    const withdrawOpt = {
      msgs: [withdraw_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.fee.gas_limit, { [feeDenom.unit]: transaction.fee.amount }, '', ''),
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
      .messagePage('TERRA')
      .messagePage('LUNA')
      .messagePage('Reward')
      .addressPage(transaction.validatorAddress.toLowerCase())
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Smart Contract: Luna to ERC20 Token Swap', async () => {
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
      chainId: chain,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      senderAddress: walletAddress,
      contractAddress: getRandWallet(),
      execute_msg: executeMsgObj,
      funds: {
        amount: +executeMsgObj.swap.offer_asset.amount,
        denom,
      },
      fee: {
        gas_limit: getRandInt(250000) + 1,
        amount: getRandInt(200000) + 1,
        denom: feeDenom,
      },
      memo: 'To Token swap test',
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signMsgExecuteContractTransaction(signTxData);

    const smartSwap_tx = new MsgExecuteContract(wallet.key.accAddress, transaction.contractAddress, executeMsgObj, {
      [denom.unit]: transaction.funds.amount,
    });
    const smartSwapOpt = {
      msgs: [smartSwap_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.fee.gas_limit, { [feeDenom.unit]: transaction.fee.amount }),
    };
    const signedTxSDK = mainnet.tx.encode(await wallet.createAndSignTx(smartSwapOpt));

    try {
      expect(signedTx).toEqual(signedTxSDK);
    } catch (e) {
      console.error('Test Smart Contract: Luna to ERC20 Token Swap params', transaction);
      console.error(
        'Is content equal:',
        JSON.stringify(mainnet.tx.decode(signedTx)) === JSON.stringify(mainnet.tx.decode(signedTxSDK))
      );
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('TERRA')
      .wrapPage('SMART', '')
      .addressPage(transaction.contractAddress.toLowerCase())
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Smart Contract Without Funds: ERC20 Token to Luna Swap', async () => {
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
      chainId: chain,
      accountNumber: getRandAccount(),
      sequence: getRandSequence(),
      senderAddress: walletAddress,
      contractAddress: getRandWallet(),
      execute_msg: executeMsgObj,
      fee: {
        gas_limit: getRandInt(250000) + 1,
        amount: getRandInt(200000) + 1,
        denom: feeDenom,
      },
      memo: 'To Luna swap test',
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signMsgExecuteContractTransaction(signTxData);

    const smartSwap_tx = new MsgExecuteContract(wallet.key.accAddress, transaction.contractAddress, executeMsgObj);
    const smartSwapOpt = {
      msgs: [smartSwap_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.fee.gas_limit, { [feeDenom.unit]: transaction.fee.amount }),
    };
    const signedTxSDK = mainnet.tx.encode(await wallet.createAndSignTx(smartSwapOpt));

    try {
      expect(signedTx).toEqual(signedTxSDK);
    } catch (e) {
      console.error('Test Smart Contract: ERC20 Token to Luna Swap params', transaction);
      console.error(
        'Is content equal:',
        JSON.stringify(mainnet.tx.decode(signedTx)) === JSON.stringify(mainnet.tx.decode(signedTxSDK))
      );
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('TERRA')
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
        amount: "100000", //(getRandInt(12000000) + 1).toString(),
        recipient: "terra1u29qtwr0u4psv8z2kn2tgxalf5efunfqj3whjv" //getRandWallet(),
      },
    };
    const transaction = {
      chainId: chain,
      accountNumber: "2343", //getRandAccount(),
      sequence: "5", //getRandSequence(),
      senderAddress: walletAddress,
      contractAddress: token.contractAddress,
      execute_msg: executeMsgObj,
      option: {
        info: {
          symbol: token.symbol,
          decimals: token.unit,
        },
      },
      fee: {
        gas_limit: 120000, //getRandInt(120000) + 1,
        denom: feeDenom,
        amount: 18000, //getRandInt(5000000) + 1,
      },
      memo: 'Send cw20 test',
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signMsgCW20Transaction(signTxData);

    const cw20_tx = new MsgExecuteContract(wallet.key.accAddress, transaction.contractAddress, executeMsgObj);
    const cw20Opt = {
      msgs: [cw20_tx],
      memo: transaction.memo,
      accountNumber: parseInt(transaction.accountNumber),
      sequence: parseInt(transaction.sequence),
      fee: new Fee(transaction.fee.gas_limit, { [feeDenom.unit]: transaction.fee.amount }, '', ''),
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
      .messagePage('TERRA')
      .messagePage(token.symbol)
      .addressPage(executeMsgObj.transfer.recipient.toLowerCase())
      .amountPage(+executeMsgObj.transfer.amount / 1000000)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Wallet Connect MsgSend', async () => {
    const denom = getRandDenom();
    const feeDenom = getRandDenom();
    const accountNumber = getRandAccount();
    const sequence = getRandSequence();
    const toAddress = getRandWallet();
    const coinAmount = getRandInt(1000000000) + 1;
    const params = {
      msgs: [
        {
          '@type': '/cosmos.bank.v1beta1.MsgSend',
          amount: [{ amount: coinAmount, denom: denom.unit }],
          from_address: walletAddress,
          to_address: toAddress,
        },
      ],
      fee: {
        amount: [{ amount: '' + getRandInt(5000000) + 1, denom: feeDenom.unit }],
        gas_limit: '' + getRandInt(250000) + 1,
        granter: '',
        payer: '',
      },
      memo: 'Send wallet connect MsgSend test',
      accountNumber: +accountNumber,
      sequence: +sequence,
      signMode: 1,
    };
    const transaction = {
      chainId: chain,
      accountNumber,
      sequence,
      msgs: params.msgs,
      fee: params.fee,
      memo: params.memo,
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signTransaction(signTxData);
    const signedTxSDK = await wallet.createAndSignTx(txParamParser(params));

    try {
      expect(signedTx).toEqual(mainnet.tx.encode(signedTxSDK));
    } catch (e) {
      console.error('Test Wallet Connect MsgSend', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('TERRA')
      .messagePage(denom.name)
      .addressPage(toAddress.toLowerCase())
      .amountPage(+coinAmount / 1000000)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Wallet Connect MsgDelegate', async () => {
    const feeDenom = getRandDenom();
    const accountNumber = getRandAccount();
    const sequence = getRandSequence();
    const validatorAddress = getRandWallet();
    const coinAmount = getRandInt(1000000000) + 1;
    const params = {
      msgs: [
        {
          '@type': '/cosmos.staking.v1beta1.MsgDelegate',
          delegator_address: walletAddress,
          validator_address: validatorAddress,
          amount: { amount: coinAmount, denom: 'uluna' },
        },
      ],
      fee: {
        amount: [{ amount: '' + getRandInt(5000000) + 1, denom: feeDenom.unit }],
        gas_limit: '' + getRandInt(250000) + 1,
        granter: '',
        payer: '',
      },
      memo: 'Send wallet connect MsgDelegate test',
      accountNumber: +accountNumber,
      sequence: +sequence,
      signMode: 1,
    };
    const transaction = {
      chainId: chain,
      accountNumber,
      sequence,
      msgs: params.msgs,
      fee: params.fee,
      memo: params.memo,
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signTransaction(signTxData);
    const signedTxSDK = await wallet.createAndSignTx(txParamParser(params));

    try {
      expect(signedTx).toEqual(mainnet.tx.encode(signedTxSDK));
    } catch (e) {
      console.error('Test Wallet Connect MsgDelegate', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('TERRA')
      .messagePage('LUNA')
      .messagePage('Delgt')
      .addressPage(validatorAddress.toLowerCase())
      .amountPage(+coinAmount / 1000000)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Wallet Connect MsgUndelegate', async () => {
    const feeDenom = getRandDenom();
    const accountNumber = getRandAccount();
    const sequence = getRandSequence();
    const validatorAddress = getRandWallet();
    const coinAmount = getRandInt(1000000000) + 1;
    const params = {
      msgs: [
        {
          '@type': '/cosmos.staking.v1beta1.MsgUndelegate',
          delegator_address: walletAddress,
          validator_address: validatorAddress,
          amount: { amount: coinAmount, denom: 'uluna' },
        },
      ],
      fee: {
        amount: [{ amount: '' + getRandInt(5000000) + 1, denom: feeDenom.unit }],
        gas_limit: '' + getRandInt(250000) + 1,
        granter: '',
        payer: '',
      },
      memo: 'Send wallet connect MsgUndelegate test',
      accountNumber: +accountNumber,
      sequence: +sequence,
      signMode: 1,
    };
    const transaction = {
      chainId: chain,
      accountNumber,
      sequence,
      msgs: params.msgs,
      fee: params.fee,
      memo: params.memo,
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signTransaction(signTxData);
    const signedTxSDK = await wallet.createAndSignTx(txParamParser(params));

    try {
      expect(signedTx).toEqual(mainnet.tx.encode(signedTxSDK));
    } catch (e) {
      console.error('Test Wallet Connect MsgUndelegate params', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('TERRA')
      .messagePage('LUNA')
      .messagePage('UnDel')
      .addressPage(validatorAddress.toLowerCase())
      .amountPage(+coinAmount / 1000000)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Wallet Connect MsgWithdrawDelegatorReward', async () => {
    const feeDenom = getRandDenom();
    const accountNumber = getRandAccount();
    const sequence = getRandSequence();
    const validatorAddress = getRandWallet();
    const params = {
      msgs: [
        {
          '@type': '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
          delegator_address: walletAddress,
          validator_address: validatorAddress,
        },
      ],
      fee: {
        amount: [{ amount: '' + getRandInt(5000000) + 1, denom: feeDenom.unit }],
        gas_limit: '' + getRandInt(250000) + 1,
        granter: '',
        payer: '',
      },
      memo: 'Send wallet connect MsgWithdrawDelegatorReward test',
      accountNumber: +accountNumber,
      sequence: +sequence,
      signMode: 1,
    };
    const transaction = {
      chainId: chain,
      accountNumber,
      sequence,
      msgs: params.msgs,
      fee: params.fee,
      memo: params.memo,
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signTransaction(signTxData);
    const signedTxSDK = await wallet.createAndSignTx(txParamParser(params));

    try {
      expect(signedTx).toEqual(mainnet.tx.encode(signedTxSDK));
    } catch (e) {
      console.error('Test Wallet Connect MsgWithdrawDelegatorReward', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('TERRA')
      .messagePage('LUNA')
      .messagePage('Reward')
      .addressPage(validatorAddress.toLowerCase())
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Wallet Connect MsgCW20', async () => {
    const token = getRandToken();
    const feeDenom = getRandDenom();
    const accountNumber = getRandAccount();
    const sequence = getRandSequence();
    const executeMsgObj = {
      transfer: {
        amount: (getRandInt(12000000) + 1).toString(),
        recipient: getRandWallet(),
      },
    };
    const params = {
      msgs: [
        {
          '@type': '/cosmwasm.wasm.v1.MsgExecuteContract',
          sender: walletAddress,
          contract: token.contractAddress,
          msg: executeMsgObj,
          //execute_msg: executeMsgObj,
        },
      ],
      fee: {
        amount: [{ amount: '' + getRandInt(5000000) + 1, denom: feeDenom.unit }],
        gas_limit: '' + getRandInt(250000) + 1,
        granter: '',
        payer: '',
      },
      memo: 'Send wallet connect MsgCW20 test',
      accountNumber: +accountNumber,
      sequence: +sequence,
      signMode: 1,
    };
    const transaction = {
      chainId: chain,
      accountNumber,
      sequence,
      msgs: params.msgs,
      fee: params.fee,
      memo: params.memo,
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signTransaction(signTxData);
    const temp = txParamParser(params);
    console.error('Temp', temp);
    const signedTxSDK = await wallet.createAndSignTx(temp);

    try {
      expect(signedTx).toEqual(mainnet.tx.encode(signedTxSDK));
    } catch (e) {
      console.error('Test Wallet Connect MsgCW20', transaction);
      console.error(
        'Is content equal:',
        JSON.stringify(mainnet.tx.decode(signedTx)) === JSON.stringify(signedTxSDK)
      );
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('TERRA')
      .messagePage(token.symbol)
      .addressPage(executeMsgObj.transfer.recipient.toLowerCase())
      .amountPage(+executeMsgObj.transfer.amount / 1000000)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Wallet Connect Multiple MsgSend', async () => {
    const denom = getRandDenom();
    const denom1 = getRandDenom();
    const feeDenom = getRandDenom();
    const accountNumber = getRandAccount();
    const sequence = getRandSequence();
    const toAddress = getRandWallet();
    const coinAmount = getRandInt(1000000000) + 1;
    const coinAmount1 = getRandInt(1000000000) + 1;
    const params = {
      msgs: [
        {
          '@type': '/cosmos.bank.v1beta1.MsgSend',
          amount: [{ amount: coinAmount, denom: denom.unit }],
          from_address: walletAddress,
          to_address: toAddress,
        },
        {
          '@type': '/cosmos.bank.v1beta1.MsgSend',
          amount: [{ amount: coinAmount1, denom: denom1.unit }],
          from_address: walletAddress,
          to_address: toAddress,
        },
      ],
      fee: {
        amount: [{ amount: '' + getRandInt(5000000) + 1, denom: feeDenom.unit }],
        gas_limit: '' + getRandInt(250000) + 1,
        granter: '',
        payer: '',
      },
      memo: 'Send wallet connect Multiple MsgSend test',
      accountNumber: +accountNumber,
      sequence: +sequence,
      signMode: 1,
    };
    const transaction = {
      chainId: chain,
      accountNumber,
      sequence,
      msgs: params.msgs,
      fee: params.fee,
      memo: params.memo,
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signTransaction(signTxData);
    const signedTxSDK = await wallet.createAndSignTx(txParamParser(params));

    try {
      expect(signedTx).toEqual(mainnet.tx.encode(signedTxSDK));
    } catch (e) {
      console.error('Test Wallet Connect Multiple MsgSend', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('TERRA')
      .wrapPage('SMART', '')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Wallet Connect Many Many MsgSend', async () => {
    const feeDenom = getRandDenom();
    const accountNumber = getRandAccount();
    const sequence = getRandSequence();
    const msgs = Array.from({ length: 2000 }, () => ({
      '@type': '/cosmos.bank.v1beta1.MsgSend',
      amount: [{ amount: getRandInt(1000000000) + 1, denom: getRandDenom().unit }],
      from_address: walletAddress,
      to_address: getRandWallet(),
    }));
    const params = {
      msgs,
      fee: {
        amount: [{ amount: '' + getRandInt(5000000) + 1, denom: feeDenom.unit }],
        gas_limit: '' + getRandInt(250000) + 1,
        granter: '',
        payer: '',
      },
      memo: 'Send wallet connect Many Many  MsgSend test',
      accountNumber: +accountNumber,
      sequence: +sequence,
      signMode: 1,
    };
    const transaction = {
      chainId: chain,
      accountNumber,
      sequence,
      msgs: params.msgs,
      fee: params.fee,
      memo: params.memo,
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      addressIndex: 0,
      transaction,
      transport,
    };
    const signedTx = await coinTerra.signTransaction(signTxData);
    const signedTxSDK = await wallet.createAndSignTx(txParamParser(params));

    try {
      expect(signedTx).toEqual(mainnet.tx.encode(signedTxSDK));
    } catch (e) {
      console.error('Test Wallet Connect Many Many  MsgSend', transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('TERRA')
      .wrapPage('SMART', '')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });
});
