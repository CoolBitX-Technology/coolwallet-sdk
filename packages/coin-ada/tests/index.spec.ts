/* eslint-disable max-len */
import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { DisplayBuilder, getTxDetail, initialize } from '@coolwallet/testing-library';
import ADA, { Transaction, Options, TxTypes } from '../src';
import { MessageTransaction } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test ADA SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const adaSDK = new ADA();
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
    it('index 0 address', async () => {
      const address = await adaSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
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
      return await adaSDK.signTransaction(transaction, option, txType);
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

      if (cardType !== CardType.Pro) return;
      // assert tx detail
      const txDetail = await getTxDetail(transport, props.appId);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage('ADA')
        .messagePage('Delgt')
        .wrapPage('PRESS', 'BUTToN')
        .finalize();
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    });

    it('abstain with address 0', async () => {
      const transaction: Transaction = {
        addrIndexes: [0],
        inputs: [{ txId: '32f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31', index: 1 }],
        ttl: '0x7c33a67',
        change: {
          address:
            'addr1qydsrjhhedvcafgjc25j4vwrp9jtys6u3fk2sekjhh0kn9rd8wkhd8cw7uqxu5lh002qahuyznn24f6d9dxh2fekhepq7a6wsr',
          amount: 49610837,
        },
        fee: '174081',
      };

      // client will use the method to calculate tx fee
      expect(adaSDK.getTransactionSize(transaction, TxTypes.Abstain)).toMatchInlineSnapshot(`367`);

      expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.Abstain)).toMatchInlineSnapshot(
        `"84a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a6704d901028183098200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e0988102a10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd58406335e34f0543f2027cb79025d430eb219eaca98e2d2eeab8cca363f71f24fe88acdba79e9f42880d2ae2e28e4710b65ddafdc708ee1e418e7250aa5550783d06825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d2584079bb80887fb5440a836b7d2d0500a2b96b63e4e081d834cffd82dbbca77fc88e5efde47475b1345687acb0ec7d42479feb5baf2b983ed09a25a8a5c0f32cf70bf5f6"`
      );

      if (cardType !== CardType.Pro) return;
      // assert tx detail
      const txDetail = await getTxDetail(transport, props.appId);
      const expectedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage('ADA')
        .messagePage('Abstain')
        .wrapPage('PRESS', 'BUTToN')
        .finalize();
      expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
    });
  });

  describe('Test sign message', () => {
    const sign_tx_by_coolwallet_sdk = async (message: string) => {
      const messageTransaction: MessageTransaction = {
        receiveAddress:
          'addr1qyulu6ra4ennas49mn77n4cpxcy7862sdx25f4sw8ea5yh3yu4d4xk2aku478dgmuqmuk7s0eh96h63svdtv5qhquzvqu94v7k',
        addrIndex: 0,
        message: message,
      };

      const option: Options = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      const result = await adaSDK.signMessage(messageTransaction, option);
      return result;
    };

    it('signMessage', async () => {
      expect(await sign_tx_by_coolwallet_sdk('')).toMatchInlineSnapshot(
        `"845846a20127676164647265737358390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a166686173686564f4405840dd5bd6ea1608be992bee0d9241a2a2b6950f0ac849dd0d776ec4dbb73744d5f9aac5d6edb6f422023357dd55738bfe6f0584646646123d671dd918fa0fb5a40b"`
      );

      expect(await sign_tx_by_coolwallet_sdk('Hello')).toMatchInlineSnapshot(
        `"845846a20127676164647265737358390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a166686173686564f44548656c6c6f5840b1b2b92c6a398c62a8d93c2f8801692bfdfc8bf125c8158a24a48f70c8882d51e4a962f362ac09f05e571670fd6bc628ddf6338593c05d35321fd2e184c7d50c"`
      );

      const message =
        'STAR 883119566159 to addr1q9wak8qad35e0yat8f9z8h3an3zzhgchrw3hgz4gxx9xgsmeyvuad4hus4yc5dnrz4hghyg0an2lzs5dlkttk9z356kqgkvz3t 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';
      expect(await sign_tx_by_coolwallet_sdk(message)).toMatchInlineSnapshot(
        `"845846a20127676164647265737358390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a166686173686564f458bd535441522038383331313935363631353920746f206164647231713977616b38716164333565307961743866397a386833616e337a7a6867636872773368677a34677878397867736d6579767561643468757334796335646e727a34686768796730616e326c7a7335646c6b74746b397a3335366b71676b767a3374203331613662616235306138346238343339616463666237383662623230323066363830376536653866646136323962343234313130666337626231633662386258402e53dcc35c537d8f5919db43120c83913c8d01ee161f3bcbbe04eef04c02fea3bc99522ee4b8541a810c7caa62bd56febad785499ae342c77dcd5684362c9f0f"`
      );

      expect(await sign_tx_by_coolwallet_sdk('哈囉')).toMatchInlineSnapshot(
        `"845846a20127676164647265737358390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a166686173686564f446e59388e59b8958400d29494df801a62a9b0833e4fd38303fee37321dd1ad7591f2e114e855f72bb37ba0df6231c7c2ab4fed47bf4967eae1a8f7915f559b50c64781554414dbd607"`
      );
    });
  });
});
