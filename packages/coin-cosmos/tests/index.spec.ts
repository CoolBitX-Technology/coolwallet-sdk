import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, DisplayBuilder, getTxDetail } from '@coolwallet/testing-library';
import { coins } from '@cosmjs/stargate';
import { EncodeObject } from '@cosmjs/proto-signing';
import * as bip39 from 'bip39';
import CosmosSDK, { getCoin, CHAIN } from '../src';
import * as ATOM_TESTS from './fixtures/atom';
import * as KAVA_TESTS from './fixtures/kava';
import * as THOR_TESTS from './fixtures/thor';
import { CosmosWallet } from './utils';
import type { PromiseValue, TestChain } from './types';
import { decodeBech32 } from '../src/utils/crypto';

let props: PromiseValue<ReturnType<typeof initialize>>;
let transport: Transport;
const CHAINS: TestChain[] = [
  {
    name: 'ATOM',
    chain: CHAIN.ATOM,
    tests: {
      MsgSend: ATOM_TESTS.MSG_SEND,
      MsgDelegate: ATOM_TESTS.MSG_DELEGATE,
      MsgUndelegate: ATOM_TESTS.MSG_UNDELEGATE,
      MsgWithdrawDelegatorReward: ATOM_TESTS.MSG_WITHDRAW,
    },
  },
  {
    name: 'KAVA',
    chain: CHAIN.KAVA,
    tests: {
      MsgSend: KAVA_TESTS.MSG_SEND,
      MsgDelegate: KAVA_TESTS.MSG_DELEGATE,
      MsgUndelegate: KAVA_TESTS.MSG_UNDELEGATE,
      MsgWithdrawDelegatorReward: KAVA_TESTS.MSG_WITHDRAW,
    },
  },
  {
    name: 'THOR',
    chain: CHAIN.THOR,
    tests: {
      MsgSend: THOR_TESTS.MSG_SEND,
    },
  },
];
const mnemonic = bip39.generateMnemonic();

describe('Test Cosmos SDK', () => {
  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
  });

  it.each(CHAINS)('Test $name Get Address', async ({ chain }) => {
    const cosmosSDK = new CosmosSDK(chain);
    const address = await cosmosSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
    const wallet = await CosmosWallet.new(chain, mnemonic);
    const expected = await wallet.getAccount();
    expect(address).toEqual(expected.address);
  });

  it.each(CHAINS)('Test $name Sign MsgSend', async ({ chain, tests: { MsgSend } }) => {
    const cosmosSDK = new CosmosSDK(chain);
    const wallet = await CosmosWallet.new(chain, mnemonic);
    const from = await wallet.getAccount();
    for (let i = 0; i < (MsgSend.length ?? 0); i++) {
      const test = MsgSend[i];
      if (!test) {
        continue;
      }
      let msgSend: EncodeObject = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: from.address,
          toAddress: test.toAddress,
          amount: coins(test.coin.amount, test.coin.denom),
        },
      };
      /// If chain is ThorChain, we should change typeUrl to /types.MsgSend
      /// Reference: https://dev.thorchain.org/thorchain-dev/how-tos/mainnet-rune-upgrade
      if (chain.getChainId() === CHAIN.THOR.getChainId()) {
        msgSend = {
          typeUrl: '/types.MsgSend',
          value: {
            fromAddress: decodeBech32(from.address),
            toAddress: decodeBech32(test.toAddress),
            amount: coins(test.coin.amount, test.coin.denom),
          },
        };
      }
      const expectedTx = await wallet.sign([msgSend], test);
      const transaction = {
        transport,
        appId: props.appId,
        appPrivateKey: props.appPrivateKey,
        addressIndex: 0,
        transaction: {
          fromAddress: from.address,
          toAddress: test.toAddress,
          coin: test.coin,
          fee: test.fee,
          accountNumber: test.account_number,
          sequence: test.sequence,
          memo: test.memo,
        },
      };
      const signedTx = await cosmosSDK.signMsgSendTransaction(transaction);
      expect(signedTx).toEqual(expectedTx);
      const coin = getCoin(chain, test.coin.denom);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage(chain.getSymbol())
        .messagePage(coin.getSymbol())
        .addressPage(test.toAddress)
        .amountPage(test.coin.amount / 10 ** coin.getDecimal())
        .wrapPage('PRESS', 'BUTToN')
        .finalize();
      const txDetail = await getTxDetail(transport, props.appId);
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });

  it.each(CHAINS)('Test $name Sign MsgDelegate', async ({ chain, tests: { MsgDelegate } }) => {
    if (!MsgDelegate) return;
    const cosmosSDK = new CosmosSDK(chain);
    const wallet = await CosmosWallet.new(chain, mnemonic);
    const from = await wallet.getAccount();
    for (let i = 0; i < (MsgDelegate.length ?? 0); i++) {
      const test = MsgDelegate[i];
      if (!test) {
        continue;
      }
      const msgDelegate: EncodeObject = {
        typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
        value: {
          delegatorAddress: from.address,
          validatorAddress: test.validator_address,
          amount: coins(test.coin.amount, test.coin.denom)[0],
        },
      };
      const expectedTx = await wallet.sign([msgDelegate], test);
      const transaction = {
        transport,
        appId: props.appId,
        appPrivateKey: props.appPrivateKey,
        addressIndex: 0,
        transaction: {
          delegatorAddress: from.address,
          validatorAddress: test.validator_address,
          coin: test.coin,
          fee: test.fee,
          accountNumber: test.account_number,
          sequence: test.sequence,
          memo: test.memo,
        },
      };
      const signedTx = await cosmosSDK.signMsgDelegateTransaction(transaction);
      expect(signedTx).toEqual(expectedTx);
      const coin = getCoin(chain, test.coin.denom);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage(chain.getSymbol())
        .messagePage(coin.getSymbol())
        .messagePage('Delgt')
        .addressPage(test.validator_address)
        .amountPage(test.coin.amount / 10 ** coin.getDecimal())
        .wrapPage('PRESS', 'BUTToN')
        .finalize();
      const txDetail = await getTxDetail(transport, props.appId);
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });

  it.each(CHAINS)('Test $name Sign MsgUndelegate', async ({ chain, tests: { MsgUndelegate } }) => {
    if (!MsgUndelegate) return;
    const cosmosSDK = new CosmosSDK(chain);
    const wallet = await CosmosWallet.new(chain, mnemonic);
    const from = await wallet.getAccount();
    for (let i = 0; i < (MsgUndelegate.length ?? 0); i++) {
      const test = MsgUndelegate[i];
      if (!test) {
        continue;
      }
      const msgUndelegate: EncodeObject = {
        typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
        value: {
          delegatorAddress: from.address,
          validatorAddress: test.validator_address,
          amount: coins(test.coin.amount, test.coin.denom)[0],
        },
      };
      const expectedTx = await wallet.sign([msgUndelegate], test);
      const transaction = {
        transport,
        appId: props.appId,
        appPrivateKey: props.appPrivateKey,
        addressIndex: 0,
        transaction: {
          delegatorAddress: from.address,
          validatorAddress: test.validator_address,
          coin: test.coin,
          fee: test.fee,
          accountNumber: test.account_number,
          sequence: test.sequence,
          memo: test.memo,
        },
      };
      const signedTx = await cosmosSDK.signMsgUndelegateTransaction(transaction);
      expect(signedTx).toEqual(expectedTx);
      const coin = getCoin(chain, test.coin.denom);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage(chain.getSymbol())
        .messagePage(coin.getSymbol())
        .messagePage('UnDel')
        .addressPage(test.validator_address)
        .amountPage(test.coin.amount / 10 ** coin.getDecimal())
        .wrapPage('PRESS', 'BUTToN')
        .finalize();
      const txDetail = await getTxDetail(transport, props.appId);
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    }
  });

  it.each(CHAINS)(
    'Test $name Sign MsgWithdrawDelegatorReward',
    async ({ chain, tests: { MsgWithdrawDelegatorReward } }) => {
      if (!MsgWithdrawDelegatorReward) return;
      const cosmosSDK = new CosmosSDK(chain);
      const wallet = await CosmosWallet.new(chain, mnemonic);
      const from = await wallet.getAccount();
      for (let i = 0; i < (MsgWithdrawDelegatorReward.length ?? 0); i++) {
        const test = MsgWithdrawDelegatorReward[i];
        if (!test) {
          continue;
        }
        const msgWithdrawDelegatorReward: EncodeObject = {
          typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
          value: {
            delegatorAddress: from.address,
            validatorAddress: test.validator_address,
          },
        };
        const expectedTx = await wallet.sign([msgWithdrawDelegatorReward], test);
        const transaction = {
          transport,
          appId: props.appId,
          appPrivateKey: props.appPrivateKey,
          addressIndex: 0,
          transaction: {
            delegatorAddress: from.address,
            validatorAddress: test.validator_address,
            fee: test.fee,
            accountNumber: test.account_number,
            sequence: test.sequence,
            memo: test.memo,
          },
        };
        const signedTx = await cosmosSDK.signMsgWithdrawDelegatorRewardTransaction(transaction);
        expect(signedTx).toEqual(expectedTx);
        const coin = chain.getNativeCoin();
        const expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage(chain.getSymbol())
          .messagePage(coin.getSymbol())
          .messagePage('Reward')
          .addressPage(test.validator_address)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
        const txDetail = await getTxDetail(transport, props.appId);
        expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
      }
    }
  );
});
