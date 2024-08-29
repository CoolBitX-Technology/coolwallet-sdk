import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import DOT, { Transaction, Options, TxTypes } from '../src';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test ADA SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  const dotSDK = new DOT();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

  beforeAll(async () => {
    transport = await createTransport();
    props = await initialize(transport, mnemonic);
  });

  describe('Test Get Address', () => {
    it('index 0 address', async () => {
      const address = await dotSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
      expect(address).toEqual(
        'addr1qyulu6ra4ennas49mn77n4cpxcy7862sdx25f4sw8ea5yh3yu4d4xk2aku478dgmuqmuk7s0eh96h63svdtv5qhquzvqu94v7k'
      );
    });
  });

  describe('Test Stake ADA', () => {
    async function get_signed_tx_by_coolwallet_sdk(transaction: Transaction, txType: TxTypes) {
      const option: Options = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        confirmCB: () => {},
        authorizedCB: () => {},
      };
      return await dotSDK.signTransaction(transaction, option, txType);
    }

    it('stake with address 0', async () => {
      const transaction: Transaction = {
        addrIndexes: [0],
        inputs: [{ txId: '32f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31', index: 1 }],
        ttl: '0x7c33a67',
        change: {
          address:
            'addr1qydsrjhhedvcafgjc25j4vwrp9jtys6u3fk2sekjhh0kn9rd8wkhd8cw7uqxu5lh002qahuyznn24f6d9dxh2fekhepq7a6wsr',
          amount: 49610837,
        },
        poolKeyHash: 'e4abcf4408584601e7c707a8902996c0c291e1a3c8300b327ae3f6ab',
        fee: '174081',
      };
      expect(
        await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.StakeRegisterAndDelegate)
      ).toMatchInlineSnapshot(
        `"83a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67048282008200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e09883028200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098581ce4abcf4408584601e7c707a8902996c0c291e1a3c8300b327ae3f6aba10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd58407651721b452fd86599c72bca6b5b04e9e8ec565a86ded61ce7b486df6577e7167aa5ecc2a192cf0dc0e24994063c62e19e751079753cd73df27f8acd45019306825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d2584064b3a468b7d173714c1e6e7bff640d75a4f3d378a9486ce18372385673adacd365904b293508f9d67b7a4a8c5b9c233a23ef3284f201cee73732fc2d53fba10bf6"`
      );
    });
  });
});
