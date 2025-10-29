import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import DOT, { COIN_SPECIES } from '../src';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test Polkadot SDK', () => {
  let transport: Transport;
  let cardType: CardType;
  let props: Mandatory;
  const dotSDK = new DOT(COIN_SPECIES.DOT);
  const ksmSDK = new DOT(COIN_SPECIES.KSM);
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

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
    props = await initialize(transport, mnemonic);
  });

  describe('Test Get Address', () => {
    it('index 0 dot address', async () => {
      const address = await dotSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
      expect(address).toMatchInlineSnapshot(`"1J49f2E6qxfqtRRaimeVbTMk6McXrVrtHTAmMKmLnayot9a"`);
    });

    it('index 0 ksm address', async () => {
      const address = await ksmSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
      expect(address).toMatchInlineSnapshot(`"1J49f2E6qxfqtRRaimeVbTMk6McXrVrtHTAmMKmLnayot9a"`);
    });
  });

  describe('Test Transfer', () => {
    it('transfer dot with address 0', async () => {
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        transaction: {
          method: {
            destAddress: '16kyNo43vJxqPYEX2qFLAxEQZc9HRJo3YtRvPK5Wt5CnDBFu',
            value: '11000000000',
          },
          fromAddress: '13Q8aoVFiN71TfaACgE56HqpMmtUbcNEMscZyDWgDZP45dfs',
          blockHash: '0x275b7a5c52a2fd1b9756a0176b18d2e8ead49781273ee6e8d1a26eab477cc98b',
          blockNumber: '22299307',
          era: '128',
          genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
          nonce: '36',
          specVersion: '1002007',
          tip: '0',
          transactionVersion: '26',
          version: 4,
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await dotSDK.signTransaction(signData)).toMatchInlineSnapshot(
        `"0x490284006a1ca31b3d34a0a0775edd95402442ccc9ba8037693f95ae8d0ad1fa3468585c02a539c81c65ea10712c9457f945bb796be0117b6a82259a3afbe19216f87de4514fe95cb40fb1671d20994fa5ef792299045454a833f5f524ff8731b5cd3ea5c700b602900000050000feb67f53df1c98db22174203883bf335c0f437bda989c9d1b9cb1e1557f377710700aea68f02"`
      );
    });

    it('transfer ksm with address 0', async () => {
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        transaction: {
          method: {
            destAddress: 'F6JLMs2mn3RL8ttA4AmMLQCPBxfNqnEVXxsGtWxo3jBkCSF',
            value: '10000000000',
          },
          fromAddress: '13Q8aoVFiN71TfaACgE56HqpMmtUbcNEMscZyDWgDZP45dfs',
          blockHash: '0x70cdfca3963252730509012205f13520f937a988ec4308624228957e4ef62e51',
          blockNumber: '11402563',
          era: '128',
          genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
          nonce: '1',
          specVersion: '1009002',
          tip: '0',
          transactionVersion: '15',
          version: 4,
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await dotSDK.signTransaction(signData)).toMatchInlineSnapshot(
        `"0x490284006a1ca31b3d34a0a0775edd95402442ccc9ba8037693f95ae8d0ad1fa3468585c02a539c81c65ea10712c9457f945bb796be0117b6a82259a3afbe19216f87de4514fe95cb40fb1671d20994fa5ef792299045454a833f5f524ff8731b5cd3ea5c700b602900000050000feb67f53df1c98db22174203883bf335c0f437bda989c9d1b9cb1e1557f377710700aea68f02"`
      );
    });
  });
});
