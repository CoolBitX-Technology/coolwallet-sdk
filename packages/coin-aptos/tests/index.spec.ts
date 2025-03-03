import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import APTOS, { Transaction, Options } from '../src';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test APTOS SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const aptosSDK = new APTOS();
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
    it('index 0 address', async () => {
      const authKey = await aptosSDK.getAuthKey(transport, props.appPrivateKey, props.appId, 0);
      expect(authKey).toEqual(`0x8386000f6d81227b001bcefc9fa05441e853d60aa14c5601d8b33985db0d069e`);
    });
  });

  describe('Test Transfer Aptos', () => {
    async function get_signed_tx_by_coolwallet_sdk(transaction: Transaction) {
      const option: Options = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
      };
      return await aptosSDK.signTransaction(transaction, option);
    }

    it('transfer with address 0', async () => {
      const transaction: Transaction = {
        keyIndex: 0,
        sender: '0x8386000f6d81227b001bcefc9fa05441e853d60aa14c5601d8b33985db0d069e',
        receiver: '0x8386000f6d81227b001bcefc9fa05441e853d60aa14c5601d8b33985db0d069e',
        sequence: 0,
        amount: '10000000',
        gasLimit: 10000000,
        gasPrice: 2000,
        expiration: 1737756287,
        chainId: 1,
      };
      expect(await get_signed_tx_by_coolwallet_sdk(transaction)).toMatchInlineSnapshot(
        `"8386000f6d81227b001bcefc9fa05441e853d60aa14c5601d8b33985db0d069e00000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e74087472616e736665720002208386000f6d81227b001bcefc9fa05441e853d60aa14c5601d8b33985db0d069e0880969800000000008096980000000000d0070000000000007f0e946700000000010020b7db5056c3538394c9f934f3482059301ef0a0d90fb2e25e1d9bfed19670acbf401dcfcbfebde3aef4bc60daa4caca9001eabd7012602ee6165e907d3529d046e96aeeba0dbee883d90f35f70b5fd793a36291eb7607cb5712eedf426f818b7402"`
      );
    });
  });
});
