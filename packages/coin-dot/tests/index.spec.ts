import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import DOT, { COIN_SPECIES, payeeType } from '../src';

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
          callIndex: '0x0500',
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
          callIndex: '0x0a00',
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
          callIndex: '0x0a00',
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await ksmSDK.signTransaction(signData)).toMatchInlineSnapshot(
        `"0x4d028400a85cb7912f332232f986d85fa0946ea3fb34dec6dfe3505de03fc417ca8ecac40205785263f6bc407523ceafe982f1b15c615d979354e77e08b56ead13b63075f10d5d874afb2f5dff1d3a3d337147633c2a9ffc11ab4510ec0b6be07e2b9166b4013604040000010a00006f55d899b0ce192aa28f914b39290de7b6c62e1c923bdd2b53221e575f09b4670700e40b5402"`
      );
    });
  });

  describe('Test KSM Bond', () => {
    it('bond with address 0', async () => {
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        transaction: {
          method: {
            payee: payeeType.stash,
            value: '100000000',
          },
          fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
          blockHash: '0x2223d671ab0c852f69d48c3e43a4ba3fe247b5769285fba1f5d99a30a36562e4',
          blockNumber: '11454979',
          era: '128',
          genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
          nonce: '2',
          specVersion: '1009003',
          tip: '0',
          transactionVersion: '15',
          version: 4,
          callIndex: '0x5900',
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await ksmSDK.signBondTransaction(signData)).toMatchInlineSnapshot(
        `"0xc1018400ea668f81581601caff0920a0a7585e5a4b3c664d45f5c2e7663931b87221b7a502fb2eb8c0c748b73f38ac7d9e5e929aa06bd755aa961f2f1e678553e9f9a8ef732dbdaa5f7a3af344ffd3427e202bdccb73b2ce7fc496a037da1f05bd8edbe60036000800000059000284d71701"`
      );
    });
  });

  describe('Test KSM BondExtra', () => {
    it('bond extra with address 0', async () => {
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        transaction: {
          method: {
            maxAdditional: '100000000',
          },
          fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
          blockHash: '0x2223d671ab0c852f69d48c3e43a4ba3fe247b5769285fba1f5d99a30a36562e4',
          blockNumber: '11454979',
          era: '128',
          genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
          nonce: '2',
          specVersion: '1009003',
          tip: '0',
          transactionVersion: '15',
          version: 4,
          callIndex: '0x5901',
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await ksmSDK.signBondExtraTransaction(signData)).toMatchInlineSnapshot(
        `"0xc1018400ea668f81581601caff0920a0a7585e5a4b3c664d45f5c2e7663931b87221b7a5025359197ea75e696afc1a79056deb71109fb6e770536dd828272d1dd80111de1050d437e5b15b81bbae5c76777b3fa5f4e8b72f6de52df80172fab6bc302682ac0036000800000059010284d717"`
      );
    });
  });

  describe('Test KSM Unbond', () => {
    it('unbond with address 0', async () => {
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        transaction: {
          method: {
            value: '100000000',
          },
          fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
          blockHash: '0x2223d671ab0c852f69d48c3e43a4ba3fe247b5769285fba1f5d99a30a36562e4',
          blockNumber: '11454979',
          era: '128',
          genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
          nonce: '2',
          specVersion: '1009003',
          tip: '0',
          transactionVersion: '15',
          version: 4,
          callIndex: '0x5902',
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await ksmSDK.signUnbondTransaction(signData)).toMatchInlineSnapshot(
        `"0xc1018400ea668f81581601caff0920a0a7585e5a4b3c664d45f5c2e7663931b87221b7a502c751d9a90be74491192c82793feaadd06bdfa45e2a33d42b9b8bddb4f9304fd337a6dfb3132181ba65f221b7a78f6cc5ce1e5606d0e5209ac4d66e48558d568b0036000800000059020284d717"`
      );
    });
  });

  describe('Test KSM Chill', () => {
    it('chill with address 0', async () => {
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        transaction: {
          fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
          blockHash: '0x2223d671ab0c852f69d48c3e43a4ba3fe247b5769285fba1f5d99a30a36562e4',
          blockNumber: '11454979',
          era: '128',
          genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
          nonce: '2',
          specVersion: '1009003',
          tip: '0',
          transactionVersion: '15',
          version: 4,
          callIndex: '0x5906',
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await ksmSDK.signChillTransaction(signData)).toMatchInlineSnapshot(
        `"0xb1018400ea668f81581601caff0920a0a7585e5a4b3c664d45f5c2e7663931b87221b7a50211d6ce7a674ea04b96cd76e47d6f54c0ce96d9b010f45de6ed53e6be1c79fcce560d73fa575abbf7c0f5a12e8048efec124c9f1f8888645a64acbfeb264ff6ca003600080000005906"`
      );
    });
  });

  describe('Test KSM Withdraw', () => {
    it('withdraw with address 0', async () => {
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        transaction: {
          method: {
            numSlashingSpans: '0',
          },
          fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
          blockHash: '0x2223d671ab0c852f69d48c3e43a4ba3fe247b5769285fba1f5d99a30a36562e4',
          blockNumber: '11454979',
          era: '128',
          genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
          nonce: '2',
          specVersion: '1009003',
          tip: '0',
          transactionVersion: '15',
          version: 4,
          callIndex: '0x5903',
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await ksmSDK.signWithdrawUnbondedTransaction(signData)).toMatchInlineSnapshot(
        `"0xc1018400ea668f81581601caff0920a0a7585e5a4b3c664d45f5c2e7663931b87221b7a502377fc233342c7286880fdea4fce34aeb44c56ecfc6e500f2a5e417b02c67c8740dec739665d71da3ed10be7b403d2763404761d2696bfe6974ece67aa111b27a00360008000000590300000000"`
      );
    });
  });

  describe('Test KSM Nominate', () => {
    it('nominate with address 0 and single hash', async () => {
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        transaction: {
          method: {
            targetAddresses: [
              'CzBdHbDPDwREbHEC8czQ7HvpqAKofN3bu6vPaa5BxoBE8vq',
              'HpdNM5bg2nzNq7d7kBuGDRQQnNPWr6buYGHwCDk8M2uCCjW',
            ],
          },
          fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
          blockHash: '0x2223d671ab0c852f69d48c3e43a4ba3fe247b5769285fba1f5d99a30a36562e4',
          blockNumber: '11454979',
          era: '128',
          genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
          nonce: '2',
          specVersion: '1009003',
          tip: '0',
          transactionVersion: '15',
          version: 4,
          callIndex: '0x5905',
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await ksmSDK.signNominateTransaction(signData)).toMatchInlineSnapshot(
        `"0xbd028400ea668f81581601caff0920a0a7585e5a4b3c664d45f5c2e7663931b87221b7a5023bb9b1b5c71051e426f2a54532306ace0fac79215ea098e231214afef656e17006a57612eab4ec1ab6469e97ffcd3b2e568c8ee89fc079981ff26a253e97087200360008000000590508001233533732bfa8bcf7a95e0dfca71309e49a1fdd70d43fd5c405505a6826ef7200e816b1ea4928a0d642ee4b4fa99aecfb717bcd47086edb11316254c2e5844d29"`
      );
    });

    it('nominate with address 0 and double hash', async () => {
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        transaction: {
          method: {
            targetAddresses: [
              'CzBdHbDPDwREbHEC8czQ7HvpqAKofN3bu6vPaa5BxoBE8vq',
              'HpdNM5bg2nzNq7d7kBuGDRQQnNPWr6buYGHwCDk8M2uCCjW',
              'DzSj1Z9PoqM6shYfgn3FTVpavhxF9Jo25kmgGU3NGGfo7qY',
              'DMYLmrFzzxqqhQwKjiq9yycvGMXTKfA9Jo1go1mfT4R7Xrb',
              'F2VckTExmProzJnwNaN3YVqDoBPS1LyNVmyG8HUAygtDV3T',
              'EcfwqGUs6Dk6ct4rvbjXrDGLte4F1sYsKRCQn2g9xJaJ3Sx',
              'FDKyVTqcnVpmQkBez6mmawzLHeZhbpGmznVZfUxZmjsVQrL',
              'EkWPyLL3kUw1iVicwkPe7JiWNFezWX5TmH4ybipDCWss3Uu',
              'HhQCLnKTcsZH75LYR1oj5MVKrs2RJyn8Cvcs8VR8nDGeKkW',
              'HeMVut33HJMXa216gqAaMifNNAadpvTPmF2Xn6aK3qLrTJM',
              'DB4BYokEZ3u9JrTtQUcVp1XwtPDjtGpq3Vv8JKBwPmWQ8zD',
              'F5YUotdVsSxgF9kuoC6UySCdJBQKUnP8ry5baevkHYqTV7T',
            ],
          },
          fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
          blockHash: '0x2223d671ab0c852f69d48c3e43a4ba3fe247b5769285fba1f5d99a30a36562e4',
          blockNumber: '11454979',
          era: '128',
          genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
          nonce: '2',
          specVersion: '1009003',
          tip: '0',
          transactionVersion: '15',
          version: 4,
          callIndex: '0x5905',
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await ksmSDK.signNominateTransaction(signData)).toMatchInlineSnapshot(
        `"0xe5078400ea668f81581601caff0920a0a7585e5a4b3c664d45f5c2e7663931b87221b7a5024c372bd38be545a41a2f7d737138d8de982ca42373615ee2f24569ce9f56f07048b745582cbec7ef63f87ce353b864499697aead36729793c9e59e0d5b3618e901360008000000590530001233533732bfa8bcf7a95e0dfca71309e49a1fdd70d43fd5c405505a6826ef7200e816b1ea4928a0d642ee4b4fa99aecfb717bcd47086edb11316254c2e5844d29003ea2629ce3574dc7dda1f20721f7d7a1109dea19ee434885d768c5c9f671271d00227d3663b23d3565e9f07343f2218b47f60b3221f8bc32692ac60a22c7fb936e006c6ed8531e6c0b882af0a42f2f23ef0a102b5d49cb5f5a24ede72d53ffce8317005a43b9d3a39997151c4d745c1513b73ea440fcd50aec480eb4ddbe65fe6924770074b215d61cfbd296a81d6ead301607072d2bbf9dd308c3606eb1b795a62bcf2f00603d8b10a42a8be5f7e755820b0c4241732614384e039536c8e43d3b4144305600e293a27231ba1550c3767df641d03102ad153acf8b4bdb7db7f180fa9d544d6500e040d1b984526d7e5222ffbec6cbe8bdaa73f9190a9e3d7244a54fc99cf37a65001a7df77359ce352ba50059ec6e2635d7964a50cae9012e4a737f5e82c353aa0d006ec238210f082cca5552aa2ce9a0d1c4be9c7bf44c04f4524ded21f8cbcc611d"`
      );
    });
  });
});
