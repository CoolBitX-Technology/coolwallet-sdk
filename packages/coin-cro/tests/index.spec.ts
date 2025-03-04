import { CardType, Transport } from '@coolwallet/core';
import { initialize, getTxDetail, DisplayBuilder } from '@coolwallet/testing-library';
import { createTransport } from '@coolwallet/transport-jre-http';
import CRO, { TX_TYPE } from '../src';
import { CHAIN_ID, SignMsgSendType } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

describe('Test CRO SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let cardType: CardType;
  const croSDK = new CRO();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

  beforeAll(async () => {
    if (process.env.CARD === 'lite') {
      cardType = CardType.Lite;
    } else {
      cardType = CardType.Pro;
    }
    if (cardType === CardType.Lite) {
      transport = (await createTransport('http://localhost:9527', CardType.Lite))!;
    } else {
      transport = (await createTransport())!;
    }
    props = await initialize(transport, mnemonic);
  });

  describe('Test Get Address', () => {
    it('CRO test get address 0', async () => {
      const address = await croSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
      const expectedAddress = 'cro1y2lk8ex0geseke743t7snntkw9aql090x8p4d6';
      expect(address.toLowerCase()).toEqual(expectedAddress.toLowerCase());
    });
  });

  describe('Sign Transfer Tx', () => {
    it('CRO test sign transaction', async () => {
      const client: SignMsgSendType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        transaction: {
          fromAddress: 'cro1ya3pu9ky4cl2ap27cyqxxyp978vp9mxvay2zwg',
          toAddress: 'cro18wd8aj4pw099szfc8zpkmq9mxfu3ymmy9dqk3n',
          amount: 1000000,
          chainId: CHAIN_ID.CRO,
          feeAmount: 39700,
          gas: 151355,
          accountNumber: '667974',
          sequence: '8',
          memo: 'FromBossWallet',
        },
        txType: TX_TYPE.SEND,
      };

      const signature = await croSDK.signTransaction(client);
      const expectedSignature = `Cp8BCowBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmwKKmNybzF5YTNwdTlreTRjbDJhcDI3Y3lxeHh5cDk3OHZwOW14dmF5Mnp3ZxIqY3JvMTh3ZDhhajRwdzA5OXN6ZmM4enBrbXE5bXhmdTN5bW15OWRxazNuGhIKB2Jhc2Vjcm8SBzEwMDAwMDASDkZyb21Cb3NzV2FsbGV0EmoKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQI8vvwdZw+4rUq79lte1v5TsXevidg1V7lriZi8y1pw+hIECgIIARgIEhYKEAoHYmFzZWNybxIFMzk3MDAQu54JGkDPlRNBcX3wCZIKmNsbOXMumRop9fFQW/A9da82lGfg5Efz0HVrsOSS1FFy3TvI0g9VBAe13mmmoZy/w0rfJa0v`;
      expect(signature).toEqual(expectedSignature);
      if (cardType === CardType.Pro) {
        const txDetail = await getTxDetail(transport, props.appId);
        const expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage('CRO')
          .addressPage('cro18wd8aj4pw099szfc8zpkmq9mxfu3ymmy9dqk3n')
          .amountPage(0.01)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();

        expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
      }
    });
  });
});
