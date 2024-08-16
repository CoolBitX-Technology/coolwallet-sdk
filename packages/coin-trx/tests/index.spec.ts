import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import TRX from '../src';
import { NormalTradeData } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test TRX SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const trxSDK = new TRX();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

  beforeAll(async () => {
    if (process.env.CARD === 'lite') {
      cardType = CardType.Lite;
    } else {
      cardType = CardType.Pro;
    }

    transport = (await createTransport(undefined, cardType))!;
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
});
