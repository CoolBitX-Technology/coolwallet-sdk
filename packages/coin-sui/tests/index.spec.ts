import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import Sui from '../src';
import { Transaction } from '@mysten/sui/transactions';
import BigNumber from 'bignumber.js';
import { coinFeeInfo } from './testData';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

const suiSDK = new Sui();

const testWalletInfo = {
  mnemonic: 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo card',
  publicKey: '03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef',
  address: '0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae024db',
};

describe('Test Sui SDK', () => {
  let transport: Transport;
  let props: Mandatory;

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, testWalletInfo.mnemonic);
  });

  it('Test retrieving the address at index 0.', async () => {
    const addressIndex = 0;
    const address = await suiSDK.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
    expect(address).toMatchInlineSnapshot(`"0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae024db"`);
  });

  it('Test Smart Transaction', async () => {
    const fromAddress = '0xa03edf19e35d72de8ec72f553b9fee4866520608def61adcb848cda03ae024db';
    const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
    const amount = '0.1';
    const decimals = 9;

    const tx = new Transaction();
    tx.setSender(fromAddress);
    tx.setGasBudget(new BigNumber(coinFeeInfo.gasBudget).toNumber());
    tx.setGasPayment(coinFeeInfo.payment);
    tx.setGasPrice(new BigNumber(coinFeeInfo.gasPrice).toNumber());
    const sendAmountUnit = new BigNumber(amount).shiftedBy(decimals).toFixed();
    const [coin] = tx.splitCoins(tx.gas, [sendAmountUnit]);
    tx.transferObjects([coin], toAddress);

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transactionInfo: tx,
      addressIndex: 0,
    };

    const signedTx = await suiSDK.signSmartContractTransaction(signTxData);
    expect(signedTx).toMatchInlineSnapshot();
  });
});
