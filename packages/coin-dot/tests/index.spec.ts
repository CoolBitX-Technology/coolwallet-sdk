import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import DOT, { COIN_SPECIES } from '../src';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;
const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

const setupConfig = async () => {
  const isGo = process.env.CARD === 'go';
  const cardType = isGo ? CardType.Go : CardType.Pro;
  const transport = (await createTransport(isGo ? 'http://localhost:9527' : undefined, cardType)) as Transport;
  const props = await initialize(transport, mnemonic);
  return {
    transport,
    props,
  };
};

describe('Test DOT SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  const dotSDK = new DOT(COIN_SPECIES.DOT);

  beforeAll(async () => {
    const config = await setupConfig();
    props = config.props;
    transport = config.transport;
  });

  describe('Test Get DOT Address', () => {
    it('test get index 0 address', async () => {
      const address = await dotSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
      expect(address).toMatchInlineSnapshot(`"1J49f2E6qxfqtRRaimeVbTMk6McXrVrtHTAmMKmLnayot9a"`);
    });
  });

  // TODO: Handle after hard fork
  xdescribe('Test DOT Transfer', () => {
    it('test transfer with address 0', async () => {
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
          mode: 1,
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await dotSDK.signTransaction(signData)).toMatchInlineSnapshot(
        `"0x4d0284006a1ca31b3d34a0a0775edd95402442ccc9ba8037693f95ae8d0ad1fa3468585c02090f28ad83f541984ec6648a1699288d4b76e16d39bbfbbd27ba746e4d381bdc5bff364c71306a18753a232c9e4544ae8cb31e6d2012c892390632054d96220401b60290000001050000feb67f53df1c98db22174203883bf335c0f437bda989c9d1b9cb1e1557f377710700aea68f02"`
      );
    });
  });
});

describe('Test KSM SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  const ksmSDK = new DOT(COIN_SPECIES.KSM);

  beforeAll(async () => {
    const config = await setupConfig();
    props = config.props;
    transport = config.transport;
  });

  describe('Test Get KSM Address', () => {
    it('test get index 0 address', async () => {
      const address = await ksmSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
      expect(address).toMatchInlineSnapshot(`"GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7"`);
    });
  });

  describe('Test KSM Transfer', () => {
    it('transfer with address 0', async () => {
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
          fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
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

      expect(await ksmSDK.signTransaction(signData)).toMatchInlineSnapshot(
        `"0x4d028400a85cb7912f332232f986d85fa0946ea3fb34dec6dfe3505de03fc417ca8ecac402082b462f42fdc3e697dc923183ae7260ad2976f109780f024da7c18ca26c4eb64ab06dbd3ba8c6a24fd84564461a0f57e8af5b9eaecde7abb122ea09a429ce7b003604040000000a00006f55d899b0ce192aa28f914b39290de7b6c62e1c923bdd2b53221e575f09b4670700e40b5402"`
      );
    });

    it('transfer with address 0 and metadatahash', async () => {
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
          fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
          blockHash: '0x70cdfca3963252730509012205f13520f937a988ec4308624228957e4ef62e51',
          blockNumber: '11402563',
          era: '128',
          genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
          nonce: '1',
          specVersion: '1009002',
          tip: '0',
          transactionVersion: '15',
          version: 4,
          mode: 1,
          metadataHash: '0x0b6df28c23c317982d27980959dd38e49409ec41e9dbac3ff75f0e11f7d56bc7',
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await ksmSDK.signTransaction(signData)).toMatchInlineSnapshot(
        `"0x4d028400a85cb7912f332232f986d85fa0946ea3fb34dec6dfe3505de03fc417ca8ecac40205785263f6bc407523ceafe982f1b15c615d979354e77e08b56ead13b63075f10d5d874afb2f5dff1d3a3d337147633c2a9ffc11ab4510ec0b6be07e2b9166b4013604040000010a00006f55d899b0ce192aa28f914b39290de7b6c62e1c923bdd2b53221e575f09b4670700e40b5402"`
      );
    });
  });
});
