import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import DOT, { COIN_SPECIES, payeeType } from '../src';
import { DOT_TX_PARAMS, KSM_TX_PARAMS } from './testData';
import {
  BondExtraTx,
  BondTx,
  dotTransaction,
  NominateTx,
  NormalTx,
  UnbondTx,
  WithdrawUnbondedTx,
} from '../src/config/types';

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

const createSignData = <T extends dotTransaction>(transport: Transport, props: Mandatory, transaction: T) => {
  return {
    transport,
    appPrivateKey: props.appPrivateKey,
    appId: props.appId,
    addressIndex: 0,
    transaction,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    confirmCB: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    authorizedCB: () => {},
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
      const signData = createSignData<NormalTx>(transport, props, {
        ...DOT_TX_PARAMS,
        method: {
          destAddress: '16kyNo43vJxqPYEX2qFLAxEQZc9HRJo3YtRvPK5Wt5CnDBFu',
          value: '11000000000',
        },
        mode: 1,
        fromAddress: '13Q8aoVFiN71TfaACgE56HqpMmtUbcNEMscZyDWgDZP45dfs',
        callIndex: '0x0500',
      });

      expect(await dotSDK.signTransaction(signData)).toMatchInlineSnapshot(
        `"0x4d0284006a1ca31b3d34a0a0775edd95402442ccc9ba8037693f95ae8d0ad1fa3468585c0211ec6e968ee65093c4d51397a6682f6dccfa95024272fa8bc873f4e44aa6b7c93accfa99d2f9f7292b6863efa6b429579174b64801ae9b2efcffd2e0e26d873501360404000001050000feb67f53df1c98db22174203883bf335c0f437bda989c9d1b9cb1e1557f377710700aea68f02"`
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
      const signData = createSignData<NormalTx>(transport, props, {
        ...KSM_TX_PARAMS,
        method: {
          destAddress: 'F6JLMs2mn3RL8ttA4AmMLQCPBxfNqnEVXxsGtWxo3jBkCSF',
          value: '10000000000',
        },
        fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
        nonce: '1',
        mode: 0,
        callIndex: '0x0a00',
      });

      expect(await ksmSDK.signTransaction(signData)).toMatchInlineSnapshot(
        `"0x4d028400a85cb7912f332232f986d85fa0946ea3fb34dec6dfe3505de03fc417ca8ecac40256193a46d4204b4309d6c12fee6ddee746ed46763ed49e5fd114d1c626d759776231ed2b21845ab25d3a67c797dc6e65a3f6e75a3214a13ab99e67d60c34d199003600040000000a00006f55d899b0ce192aa28f914b39290de7b6c62e1c923bdd2b53221e575f09b4670700e40b5402"`
      );
    });

    it('transfer with address 0 and metadatahash', async () => {
      const signData = createSignData<NormalTx>(transport, props, {
        ...KSM_TX_PARAMS,
        method: {
          destAddress: 'F6JLMs2mn3RL8ttA4AmMLQCPBxfNqnEVXxsGtWxo3jBkCSF',
          value: '10000000000',
        },
        fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
        nonce: '1',
        mode: 1,
        metadataHash: '0x0b6df28c23c317982d27980959dd38e49409ec41e9dbac3ff75f0e11f7d56bc7',
        callIndex: '0x0a00',
      });

      expect(await ksmSDK.signTransaction(signData)).toMatchInlineSnapshot(
        `"0x4d028400a85cb7912f332232f986d85fa0946ea3fb34dec6dfe3505de03fc417ca8ecac4021281c96f7bbc64e0abce566221e32dac2ad0cfc2cddddaed59de8e8ff7a68622632b3383cedafbf173675db1192e515c14f3ca01293509c07c83c3713b651811013600040000010a00006f55d899b0ce192aa28f914b39290de7b6c62e1c923bdd2b53221e575f09b4670700e40b5402"`
      );
    });
  });

  describe('Test KSM Bond', () => {
    it('bond with address 0', async () => {
      const signData = createSignData<BondTx>(transport, props, {
        ...KSM_TX_PARAMS,
        method: {
          payee: payeeType.stash,
          value: '100000000',
        },
        fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
        callIndex: '0x5900',
      });

      expect(await ksmSDK.signBondTransaction(signData)).toMatchInlineSnapshot(
        `"0xc1018400a85cb7912f332232f986d85fa0946ea3fb34dec6dfe3505de03fc417ca8ecac402fb2eb8c0c748b73f38ac7d9e5e929aa06bd755aa961f2f1e678553e9f9a8ef732dbdaa5f7a3af344ffd3427e202bdccb73b2ce7fc496a037da1f05bd8edbe60036000800000059000284d71701"`
      );
    });
  });

  describe('Test KSM BondExtra', () => {
    it('bond extra with address 0', async () => {
      const signData = createSignData<BondExtraTx>(transport, props, {
        ...KSM_TX_PARAMS,
        method: {
          maxAdditional: '100000000',
        },
        fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
        callIndex: '0x5901',
      });

      expect(await ksmSDK.signBondExtraTransaction(signData)).toMatchInlineSnapshot(
        `"0xc1018400a85cb7912f332232f986d85fa0946ea3fb34dec6dfe3505de03fc417ca8ecac4025359197ea75e696afc1a79056deb71109fb6e770536dd828272d1dd80111de1050d437e5b15b81bbae5c76777b3fa5f4e8b72f6de52df80172fab6bc302682ac0036000800000059010284d717"`
      );
    });
  });

  describe('Test KSM Unbond', () => {
    it('unbond with address 0', async () => {
      const signData = createSignData<UnbondTx>(transport, props, {
        ...KSM_TX_PARAMS,
        method: {
          value: '100000000',
        },
        fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
        callIndex: '0x5902',
      });

      expect(await ksmSDK.signUnbondTransaction(signData)).toMatchInlineSnapshot(
        `"0xc1018400a85cb7912f332232f986d85fa0946ea3fb34dec6dfe3505de03fc417ca8ecac402c751d9a90be74491192c82793feaadd06bdfa45e2a33d42b9b8bddb4f9304fd337a6dfb3132181ba65f221b7a78f6cc5ce1e5606d0e5209ac4d66e48558d568b0036000800000059020284d717"`
      );
    });
  });

  describe('Test KSM Chill', () => {
    it('chill with address 0', async () => {
      const signData = createSignData(transport, props, {
        ...KSM_TX_PARAMS,
        fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
        callIndex: '0x5906',
      });

      expect(await ksmSDK.signChillTransaction(signData)).toMatchInlineSnapshot(
        `"0xb1018400a85cb7912f332232f986d85fa0946ea3fb34dec6dfe3505de03fc417ca8ecac40211d6ce7a674ea04b96cd76e47d6f54c0ce96d9b010f45de6ed53e6be1c79fcce560d73fa575abbf7c0f5a12e8048efec124c9f1f8888645a64acbfeb264ff6ca003600080000005906"`
      );
    });
  });

  describe('Test KSM Withdraw', () => {
    it('withdraw with address 0', async () => {
      const signData = createSignData<WithdrawUnbondedTx>(transport, props, {
        ...KSM_TX_PARAMS,
        method: {
          numSlashingSpans: '0',
        },
        fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
        callIndex: '0x5903',
      });

      expect(await ksmSDK.signWithdrawUnbondedTransaction(signData)).toMatchInlineSnapshot(
        `"0xc1018400a85cb7912f332232f986d85fa0946ea3fb34dec6dfe3505de03fc417ca8ecac402377fc233342c7286880fdea4fce34aeb44c56ecfc6e500f2a5e417b02c67c8740dec739665d71da3ed10be7b403d2763404761d2696bfe6974ece67aa111b27a00360008000000590300000000"`
      );
    });
  });

  describe('Test KSM Nominate', () => {
    it('nominate with address 0 and single hash', async () => {
      const signData = createSignData<NominateTx>(transport, props, {
        ...KSM_TX_PARAMS,
        method: {
          targetAddresses: [
            'CzBdHbDPDwREbHEC8czQ7HvpqAKofN3bu6vPaa5BxoBE8vq',
            'HpdNM5bg2nzNq7d7kBuGDRQQnNPWr6buYGHwCDk8M2uCCjW',
          ],
        },
        fromAddress: 'GP573vqT849Rg5y2vkfQjkZqVt2scGTYWrzxq2ZerxGoQH7',
        callIndex: '0x5905',
      });

      expect(await ksmSDK.signNominateTransaction(signData)).toMatchInlineSnapshot(
        `"0xbd028400a85cb7912f332232f986d85fa0946ea3fb34dec6dfe3505de03fc417ca8ecac4023bb9b1b5c71051e426f2a54532306ace0fac79215ea098e231214afef656e17006a57612eab4ec1ab6469e97ffcd3b2e568c8ee89fc079981ff26a253e97087200360008000000590508001233533732bfa8bcf7a95e0dfca71309e49a1fdd70d43fd5c405505a6826ef7200e816b1ea4928a0d642ee4b4fa99aecfb717bcd47086edb11316254c2e5844d29"`
      );
    });

    it('nominate with address 0 and double hash', async () => {
      const signData = createSignData<NominateTx>(transport, props, {
        ...KSM_TX_PARAMS,
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
        callIndex: '0x5905',
      });

      expect(await ksmSDK.signNominateTransaction(signData)).toMatchInlineSnapshot(
        `"0xe5078400a85cb7912f332232f986d85fa0946ea3fb34dec6dfe3505de03fc417ca8ecac4024c372bd38be545a41a2f7d737138d8de982ca42373615ee2f24569ce9f56f07048b745582cbec7ef63f87ce353b864499697aead36729793c9e59e0d5b3618e901360008000000590530001233533732bfa8bcf7a95e0dfca71309e49a1fdd70d43fd5c405505a6826ef7200e816b1ea4928a0d642ee4b4fa99aecfb717bcd47086edb11316254c2e5844d29003ea2629ce3574dc7dda1f20721f7d7a1109dea19ee434885d768c5c9f671271d00227d3663b23d3565e9f07343f2218b47f60b3221f8bc32692ac60a22c7fb936e006c6ed8531e6c0b882af0a42f2f23ef0a102b5d49cb5f5a24ede72d53ffce8317005a43b9d3a39997151c4d745c1513b73ea440fcd50aec480eb4ddbe65fe6924770074b215d61cfbd296a81d6ead301607072d2bbf9dd308c3606eb1b795a62bcf2f00603d8b10a42a8be5f7e755820b0c4241732614384e039536c8e43d3b4144305600e293a27231ba1550c3767df641d03102ad153acf8b4bdb7db7f180fa9d544d6500e040d1b984526d7e5222ffbec6cbe8bdaa73f9190a9e3d7244a54fc99cf37a65001a7df77359ce352ba50059ec6e2635d7964a50cae9012e4a737f5e82c353aa0d006ec238210f082cca5552aa2ce9a0d1c4be9c7bf44c04f4524ded21f8cbcc611d"`
      );
    });
  });
});
