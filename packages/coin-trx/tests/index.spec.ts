import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import TRX from '../src';
import { NormalTradeData, TwoTransferData } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test TRX SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const trxSDK = new TRX();
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
    const ADDRESS_INDEX = 0;
    it('Address', async () => {
      const address = await trxSDK.getAddress(transport, props.appPrivateKey, props.appId, ADDRESS_INDEX);
      expect(address).toMatchInlineSnapshot(`"TPLnAY8HgpgHBKj6Md9SJ2qXMfFyBEfa2r"`);
    });

    it('returns chainCode and publicKey', async () => {
      const result = await trxSDK.getAccountPubKeyAndChainCode(transport, props.appPrivateKey, props.appId);
      expect(result).toMatchInlineSnapshot(`
        Object {
          "accountChainCode": "63ead171b54c7ec64cab42cff1e9c785da7bf332bca88337aecfb4cfa0299705",
          "accountPublicKey": "0225b317e6a232faae6cdbe365cf873d58185de26370ddc668ea4e5b62a67af3d7",
        }
      `);
    });

    it('returns address from address publicKey', () => {
      const addressPublicKey = '02c940ec8261a71909a762a61677360f28db60f7ad683fbb471b5929ab55abbdd5';
      const address = TRX.getAddressFromAddressPublicKey(addressPublicKey);
      expect(address).toMatchInlineSnapshot(`"TPLnAY8HgpgHBKj6Md9SJ2qXMfFyBEfa2r"`);
    });
  });

  describe('Sign Transfer Tx', () => {
    it('sign for transfer 1 TRX', async () => {
      const options: NormalTradeData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        transaction: {
          contract: {
            ownerAddress: '41fb5c19f956a2bf76e7b3d0b25237eb39e37e1420',
            toAddress: '41f8b3db62dcc33a063ad2a51fa6bbcb34a2253189',
            amount: '1000000',
          },
          refBlockBytes: '9699',
          refBlockHash: 'a0021b4f18ba9943',
          expiration: 1723634795614,
          timestamp: 1723634195614,
        },
        addressIndex: 0,
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await trxSDK.signTransaction(options)).toMatchInlineSnapshot(
        `"0a85010a0296992208a0021b4f18ba994340de888f8595325a67080112630a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412320a1541fb5c19f956a2bf76e7b3d0b25237eb39e37e1420121541f8b3db62dcc33a063ad2a51fa6bbcb34a225318918c0843d709eb9ea8495321241650e1db60b7385c39f80ec90b49d24b4b976c92715629881fe0d4221ced2b6617969dd77bf23ded784cb430a1f105e6de9c83c2795608684e397cd8fde46514b01"`
      );
    });
  });

  describe('Sign two transfer in one time', () => {
    const trxTransaction = {
      contract: {
        ownerAddress: '41fb5c19f956a2bf76e7b3d0b25237eb39e37e1420',
        toAddress: '41f8b3db62dcc33a063ad2a51fa6bbcb34a2253189',
        amount: '1000000',
      },
      refBlockBytes: '9699',
      refBlockHash: 'a0021b4f18ba9943',
      expiration: 1723634795614,
      timestamp: 1723634195614,
    };

    const usdtTransaction = {
      refBlockBytes: 'a7a7',
      refBlockHash: '07e3471aa053b36d',
      timestamp: 1770261862792,
      expiration: 1770262221000,
      contract: {
        ownerAddress: '41fb5c19f956a2bf76e7b3d0b25237eb39e37e1420',
        contractAddress: '41a614f803b6fd780986a42c78ec9c7f77e6ded13c',
        receiverAddress: '4199aa4fb789b27f45c9c5293260f922dda046014b',
        amount: '1000000',
      },
      feeLimit: 100000000,
      option: { info: { symbol: 'USDT', decimals: '6' } },
    };

    it('transfer 1 TRX + transfer 2 TRX', async () => {
      const options: TwoTransferData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        transaction1: trxTransaction,
        transaction2: { ...trxTransaction, contract: { ...trxTransaction.contract, amount: '2000000' } },
        addressIndex: 0,
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await trxSDK.signTwoTransfers(options)).toMatchInlineSnapshot(`
        Array [
          "0a85010a0296992208a0021b4f18ba994340de888f8595325a67080112630a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412320a1541fb5c19f956a2bf76e7b3d0b25237eb39e37e1420121541f8b3db62dcc33a063ad2a51fa6bbcb34a225318918c0843d709eb9ea8495321241650e1db60b7385c39f80ec90b49d24b4b976c92715629881fe0d4221ced2b6617969dd77bf23ded784cb430a1f105e6de9c83c2795608684e397cd8fde46514b01",
          "0a85010a0296992208a0021b4f18ba994340de888f8595325a67080112630a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412320a1541fb5c19f956a2bf76e7b3d0b25237eb39e37e1420121541f8b3db62dcc33a063ad2a51fa6bbcb34a22531891880897a709eb9ea849532124182446ea9354bdb74f9ba59fb8378856cbd38fa6c6691992ef281055125ef1cab2a2ea2262c222868ef1c8be549f1dc5da01948f1fec849a230257606d7460f0e00",
        ]
      `);
    });

    it('transfer 1 TRX + transfer 1 USDT', async () => {
      const options: TwoTransferData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        transaction1: trxTransaction,
        transaction2: usdtTransaction,
        addressIndex: 0,
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await trxSDK.signTwoTransfers(options)).toMatchInlineSnapshot(`
        Array [
          "0a85010a0296992208a0021b4f18ba994340de888f8595325a67080112630a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412320a1541fb5c19f956a2bf76e7b3d0b25237eb39e37e1420121541f8b3db62dcc33a063ad2a51fa6bbcb34a225318918c0843d709eb9ea8495321241650e1db60b7385c39f80ec90b49d24b4b976c92715629881fe0d4221ced2b6617969dd77bf23ded784cb430a1f105e6de9c83c2795608684e397cd8fde46514b01",
          "0ad4010a02a7a7220807e3471aa053b36d40c8a1e7dec2335aaf01081f12aa010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412750a164141fb5c19f956a2bf76e7b3d0b25237eb39e37e1420121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb00000000000000000000000099aa4fb789b27f45c9c5293260f922dda046014b00000000000000000000000000000000000000000000000000000000000f42407088b3d1dec233900180c2d72f12413e698770de28e066d020be447e9e9687b270b1e1414947f6e8d18039e1e8129427329900d07dfc9aa6ce9cfc0b456e5b3e2095bbdd4c669abeb6a2ee75354c4e01",
        ]
      `);
    });
  });
});
