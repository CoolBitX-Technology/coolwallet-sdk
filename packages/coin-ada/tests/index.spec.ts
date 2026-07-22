/* eslint-disable max-len */
import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { DisplayBuilder, getTxDetail, initialize } from '@coolwallet/testing-library';
import crypto from 'crypto';
import ADA, { Transaction, Options, TxTypes, TokenAsset } from '../src';
import { MessageTransaction, MajorType } from '../src/config/types';
import { cborEncode } from '../src/utils';
import { genTxBody } from '../src/utils/transactionUtil';
import { TOKEN_TYPE } from '../src/config/tokenType';

const blake2b = require('blake2b');

// Standard SPKI DER prefix for a raw 32-byte Ed25519 public key, so Node's crypto can verify it.
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const blake2b256 = (buf: Buffer): Buffer => Buffer.from(blake2b(32).update(buf).digest());
const ed25519Verify = (message: Buffer, publicKey: Buffer, signature: Buffer): boolean => {
  const key = crypto.createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, publicKey]),
    format: 'der',
    type: 'spki',
  });
  return crypto.verify(null, message, key, signature);
};

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

  describe('Test sign transaction', () => {
    // Shared transaction parts. The token branch reuses the same change ADA amount as the
    // no-token branch — the only difference is `assets`, so each pair isolates the effect of
    // a token-bearing change on the signed tx. Token figures echo the real MELD case.
    const INPUTS = [{ txId: '32f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31', index: 1 }];
    const TTL = '0x7c33a67';
    const FEE = '174081';
    const CHANGE_ADDRESS =
      'addr1qydsrjhhedvcafgjc25j4vwrp9jtys6u3fk2sekjhh0kn9rd8wkhd8cw7uqxu5lh002qahuyznn24f6d9dxh2fekhepq7a6wsr';
    const CHANGE_AMOUNT = 49610837;
    const RECEIVE_ADDRESS =
      'addr1qyulu6ra4ennas49mn77n4cpxcy7862sdx25f4sw8ea5yh3yu4d4xk2aku478dgmuqmuk7s0eh96h63svdtv5qhquzvqu94v7k';
    const RECEIVE_AMOUNT = 1000000;
    const POOL_KEY_HASH = 'e4abcf4408584601e7c707a8902996c0c291e1a3c8300b327ae3f6ab';
    const WITHDRAW_AMOUNT = '1000000';
    const TOKEN_ASSETS: TokenAsset[] = [
      { policyId: '6ac8ef33b510ec004fe11585f7c5a9f0c07f0c23428ab4f29c1d7d10', assetName: '4d454c44', amount: 251 },
      { policyId: '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6', assetName: '4d494e', amount: 123456 },
    ];

    const buildTx = (overrides: Partial<Transaction>, withToken: boolean): Transaction => ({
      addrIndexes: [0],
      inputs: INPUTS,
      ttl: TTL,
      fee: FEE,
      change: withToken
        ? { address: CHANGE_ADDRESS, amount: CHANGE_AMOUNT, assets: TOKEN_ASSETS }
        : { address: CHANGE_ADDRESS, amount: CHANGE_AMOUNT },
      ...overrides,
    });

    async function get_signed_tx_by_coolwallet_sdk(transaction: Transaction, txType: TxTypes) {
      const option: Options = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        confirmCB: () => {},
        authorizedCB: () => {},
      };
      const signed = await adaSDK.signTransaction(transaction, option, txType);
      await expectCardSignedOurBody(signed, transaction, txType);
      return signed;
    }

    // Verify the card signed the body we expect: it signs blake2b256 of the body it built from the
    // arguments, so re-derive that body with genTxBody and check the Ed25519 signature under each
    // witness vkey. Checks the signed bytes only, not what the card displayed.
    async function expectCardSignedOurBody(signedHex: string, transaction: Transaction, txType: TxTypes) {
      const accPubKey = await adaSDK.getAccountPubKey(transport, props.appPrivateKey, props.appId);
      const body = genTxBody(transaction, accPubKey, txType, false);
      const isAbstain = txType === TxTypes.Abstain;
      const prefix = isAbstain ? '84' : '83';
      const suffix = isAbstain ? 'f5f6' : 'f6';
      expect(signedHex.startsWith(prefix + body)).toBe(true);

      const witnessSet = signedHex.slice(prefix.length + body.length, signedHex.length - suffix.length);
      expect(witnessSet.slice(0, 4)).toBe('a100'); // map{0: [vkey witnesses]}
      const count = parseInt(witnessSet.slice(4, 6), 16) - 0x80; // array header 0x8N
      const hash = blake2b256(Buffer.from(body, 'hex'));
      let rest = witnessSet.slice(6);
      for (let i = 0; i < count; i += 1) {
        expect(rest.slice(0, 6)).toBe('825820'); // [ bytes(32) vkey ...
        const vkey = rest.slice(6, 70);
        expect(rest.slice(70, 74)).toBe('5840'); // bytes(64) signature
        const sig = rest.slice(74, 202);
        expect(ed25519Verify(hash, Buffer.from(vkey, 'hex'), Buffer.from(sig, 'hex'))).toBe(true);
        rest = rest.slice(202);
      }
      expect(rest).toBe(''); // no trailing bytes: every witness accounted for
    }

    describe('Transfer', () => {
      const overrides: Partial<Transaction> = { output: { address: RECEIVE_ADDRESS, amount: RECEIVE_AMOUNT } };

      it('without token', async () => {
        const transaction = buildTx(overrides, false);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.Transfer)).toMatchInlineSnapshot(`289`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.Transfer)).toMatchInlineSnapshot(
          `"83a4008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a310101828258390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e0981a000f4240825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67a10081825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd58409c4d4345bff151bfed308d1662be4742957dd27859d0252409db9c1a14543027989d047a38705a98639e3df4cf71960a7edaacec7311cd846cdd0af3b0c3e708f6"`
        );
      });

      it('with token', async () => {
        const transaction = buildTx(overrides, true);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.Transfer)).toMatchInlineSnapshot(`369`);
        // previous snapshot used non-canonical policy order; cleared so the canonical bytes regenerate
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.Transfer)).toMatchInlineSnapshot(
          `"83a4008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a310101828258390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e0981a000f4240825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be42821a02f50055a2581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240581c6ac8ef33b510ec004fe11585f7c5a9f0c07f0c23428ab4f29c1d7d10a1444d454c4418fb021a0002a801031a07c33a67a10081825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd5840b03cb6ee57ffbb0ca63c0e012bb22ed219457281acc2bb831e460d145bc47198d2fc3b614735c4bade8e64dca79a713c407f25ba30303c4689e16ad9193b7406f6"`
        );
      });
    });

    describe('TokenTransfer', () => {
      const RECEIVE_LOVELACE = 1200000; // min-ADA that accompanies the token
      const TOKEN: TokenAsset = {
        policyId: '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6',
        assetName: '4d494e',
        amount: 123456,
      };

      it('with ADA-only change', async () => {
        const transaction = buildTx(
          { output: { address: RECEIVE_ADDRESS, amount: RECEIVE_LOVELACE, token: TOKEN } },
          false
        );
        expect(adaSDK.getTransactionSize(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(`331`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(
          `"83a4008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a310101828258390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098821a00124f80a1581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67a10081825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd584006ce374e5784e6615fee49587fbb634435e157881fd8f099770902c33f8ef6618aae904ff398810ed03d50e87ecbff2f6dba2d98c8a9700648d64f7bfad66303f6"`
        );
      });

      it('with token change (leftover tokens ride back in change)', async () => {
        const transaction = buildTx(
          { output: { address: RECEIVE_ADDRESS, amount: RECEIVE_LOVELACE, token: TOKEN } },
          true
        );
        expect(adaSDK.getTransactionSize(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(`411`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(
          `"83a4008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a310101828258390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098821a00124f80a1581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be42821a02f50055a2581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240581c6ac8ef33b510ec004fe11585f7c5a9f0c07f0c23428ab4f29c1d7d10a1444d454c4418fb021a0002a801031a07c33a67a10081825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd58406e54cd82b924e707d704cabdc2f9bb9f7164a032fb1acfba254ead61ba9fbcc2c5e62c477b4ee573a56b0c5ed6c4eabe78f40bb8619ebeee532b547522eeb606f6"`
        );

        if (cardType !== CardType.Pro) return;
        // "@MIN" while MIN's signature is empty; bare "MIN" once it's signed.
        const minEntry = TOKEN_TYPE.find((t) => t.policyId === TOKEN.policyId && t.assetName === TOKEN.assetName);
        const minSymbolPage = minEntry?.signature ? 'MIN' : '@MIN';
        const txDetail = await getTxDetail(transport, props.appId);
        const expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage('ADA')
          .messagePage(minSymbolPage)
          .addressPage(RECEIVE_ADDRESS.toLowerCase())
          .amountPage(Number(TOKEN.amount) / 1e6) // MIN decimals = 6
          .messagePage('ADA') // label so the next amount reads as the min-ADA, not a second token amount
          .amountPage(RECEIVE_LOVELACE / 1e6) // ADA decimals = 6
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
        expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
      });

      // Every official token, end to end: the token identity must land in the receiver output and
      // the card must show it (as "@symbol" until its signature is filled in) with the right decimals.
      // No inline snapshot here — jest can't rewrite one line per it.each row — so we assert structure
      // and display directly; the MIN cases above pin the exact bytes.
      const TOKEN_AMOUNT = 123456;
      it.each(TOKEN_TYPE)(
        'sends official token $symbol (verified symbol once signed, otherwise @$symbol)',
        async ({ symbol, policyId, assetName, decimals, signature }) => {
          const token: TokenAsset = { policyId, assetName, amount: TOKEN_AMOUNT };
          const transaction = buildTx({ output: { address: RECEIVE_ADDRESS, amount: RECEIVE_LOVELACE, token } }, false);
          const signed = await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.TokenTransfer);

          // token identity is in the (card-built) receiver output
          const assetNameCbor = cborEncode(MajorType.Byte, Buffer.from(assetName, 'hex').length) + assetName;
          expect(signed).toContain('581c' + policyId);
          expect(signed).toContain(assetNameCbor + cborEncode(MajorType.Uint, TOKEN_AMOUNT));

          if (cardType !== CardType.Pro) return;
          // signed -> verified, shows the bare symbol; unsigned -> shown as "@symbol"
          const symbolPage = signature ? symbol : '@' + symbol;
          const txDetail = await getTxDetail(transport, props.appId);
          const expectedTxDetail = new DisplayBuilder()
            .messagePage('TEST')
            .messagePage('ADA')
            .messagePage(symbolPage)
            .addressPage(RECEIVE_ADDRESS.toLowerCase())
            .amountPage(TOKEN_AMOUNT / 10 ** decimals)
            .messagePage('ADA') // label so the next amount reads as the min-ADA, not a second token amount
            .amountPage(RECEIVE_LOVELACE / 1e6)
            .wrapPage('PRESS', 'BUTToN')
            .finalize();
          expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
        }
      );

      // Custom / unofficial token: not in TOKEN_TYPE, so the caller supplies symbol + decimals and the
      // signature slot is all zeros -> ifSigned fails -> the card shows "@FOO" (unverified). This pins
      // the unverified path that the official tokens no longer exercise now that they are signed.
      it('sends a custom (unofficial) token, shown unverified with @', async () => {
        const custom: TokenAsset = {
          policyId: '00112233445566778899aabbccddeeff00112233445566778899aabb',
          assetName: '54455354', // "TEST"
          amount: 123456,
          symbol: 'FOO',
          decimals: 4,
        };
        const transaction = buildTx(
          { output: { address: RECEIVE_ADDRESS, amount: RECEIVE_LOVELACE, token: custom } },
          false
        );
        expect(adaSDK.getTransactionSize(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(`332`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(
          `"83a4008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a310101828258390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098821a00124f80a1581c00112233445566778899aabbccddeeff00112233445566778899aabba144544553541a0001e240825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67a10081825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd58408015db425fa23d63ea8c04ad359c074ac36dbcef562272b0ce6f900ea56f8af6d0a66c9b1812b396cec34d5e5de92bcba898f141099be962774b2592ff9e7e0df6"`
        );

        if (cardType !== CardType.Pro) return;
        const txDetail = await getTxDetail(transport, props.appId);
        const expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage('ADA')
          .messagePage('@FOO')
          .addressPage(RECEIVE_ADDRESS.toLowerCase())
          .amountPage(Number(custom.amount) / 1e4) // custom decimals = 4
          .messagePage('ADA') // label so the next amount reads as the min-ADA, not a second token amount
          .amountPage(RECEIVE_LOVELACE / 1e6)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
        expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
      });

      // A displayed integer >= 1e8 can't be rendered by the SE, so the transfer is blind-signed with
      // the TOKEN_TRANSFER_BLIND script: the card shows "ADA -> SMART -> PRESS" instead of amounts.
      // HOSKY has 0 decimals, so 5,000,000,000 tokens displays as 5e9 (>= 1e8) -> blind. That amount
      // also exercises the 8-byte CBOR uint path (> 0xffffffff) in the body.
      it('blind-signs when the displayed amount reaches 1e8 (shows SMART)', async () => {
        const hosky = TOKEN_TYPE.find((t) => t.symbol === 'HOSKY')!;
        const token: TokenAsset = { policyId: hosky.policyId, assetName: hosky.assetName, amount: 5_000_000_000 };
        const transaction = buildTx({ output: { address: RECEIVE_ADDRESS, amount: RECEIVE_LOVELACE, token } }, false);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(`337`);
        const signed = await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.TokenTransfer);
        expect(signed).toMatchInlineSnapshot(
          `"83a4008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a310101828258390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098821a00124f80a1581ca0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235a145484f534b591b000000012a05f200825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67a10081825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd5840bc8a6eb24215b2e42b6e2f8a8eec401d5d156f771853b905a121df4c8d904ee65cc073077459235400240c8bb50e3cc845a62c4648e8f3bf4b0ecf642dc7780ff6"`
        );

        // token still lands in the body even though the amount is blind on screen
        const assetNameCbor = cborEncode(MajorType.Byte, Buffer.from(hosky.assetName, 'hex').length) + hosky.assetName;
        expect(signed).toContain('581c' + hosky.policyId);
        expect(signed).toContain(assetNameCbor + cborEncode(MajorType.Uint, 5_000_000_000));

        if (cardType !== CardType.Pro) return;
        const txDetail = await getTxDetail(transport, props.appId);
        // Full blind, aligned with every other chain's token blind sign (TON/TRC20/ERC20/...):
        // symbol, address and amounts are all replaced by a single SMART page.
        const expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage('ADA')
          .wrapPage('SMART', '')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
        expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
      });

      // Small amount (<= 0x17) lives inside the CBOR prefix byte, exercising the "value in prefix"
      // branch of both the body encoding and the on-card amount display.
      it('small token amount embedded in the CBOR prefix', async () => {
        const token: TokenAsset = { ...TOKEN, amount: 5 };
        const transaction = buildTx({ output: { address: RECEIVE_ADDRESS, amount: RECEIVE_LOVELACE, token } }, false);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(`327`);
        const signed = await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.TokenTransfer);
        expect(signed).toMatchInlineSnapshot(
          `"83a4008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a310101828258390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098821a00124f80a1581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e05825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67a10081825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd5840073a531af2df2addbb87a84e6f9870adea07c16eafa9af7f97a4ca43f2f37c864f84d332e1ed743bb6a9c93482c83a31f6d057e87380103056a1bc01ab324907f6"`
        );
        expect(signed).toContain('434d494e05'); // "MIN" name + amount 5 (cbor "05")

        if (cardType !== CardType.Pro) return;
        const min = TOKEN_TYPE.find((t) => t.symbol === 'MIN')!;
        const txDetail = await getTxDetail(transport, props.appId);
        const expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage('ADA')
          .messagePage(min.signature ? 'MIN' : '@MIN')
          .addressPage(RECEIVE_ADDRESS.toLowerCase())
          .amountPage(5 / 1e6) // MIN decimals = 6
          .messagePage('ADA')
          .amountPage(RECEIVE_LOVELACE / 1e6)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
        expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
      });

      // Asset name >= 24 bytes uses the 2-byte CBOR byte-string header (0x58 <len>); official tokens
      // (<= 8 bytes) never reach it. Unofficial token, so it shows unverified.
      it('long asset name (2-byte CBOR header)', async () => {
        const assetName = 'ab'.repeat(28); // 28 bytes -> header 0x58 0x1c = "581c"
        const token: TokenAsset = { policyId: '11'.repeat(28), assetName, amount: 123456, symbol: 'LONG', decimals: 0 };
        const transaction = buildTx({ output: { address: RECEIVE_ADDRESS, amount: RECEIVE_LOVELACE, token } }, false);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(`357`);
        const signed = await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.TokenTransfer);
        expect(signed).toMatchInlineSnapshot(
          `"83a4008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a310101828258390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098821a00124f80a1581c11111111111111111111111111111111111111111111111111111111a1581cabababababababababababababababababababababababababababab1a0001e240825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67a10081825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd5840b051ecabe4d499faa25b12be8f72c92564bed91f8390c81bd015788a7f6e566080d9bef87cee323264c6cf9656c116fda335589d72e0756aac4bb2ee95efe704f6"`
        );
        expect(signed).toContain('581c' + assetName + '1a0001e240'); // 28-byte name (581c header) + amount
      });

      // Empty asset name -> the shortest byte-string header (0x40), the lower length bound.
      it('empty asset name', async () => {
        const token: TokenAsset = {
          policyId: '22'.repeat(28),
          assetName: '',
          amount: 123456,
          symbol: 'NONE',
          decimals: 0,
        };
        const transaction = buildTx({ output: { address: RECEIVE_ADDRESS, amount: RECEIVE_LOVELACE, token } }, false);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(`328`);
        const signed = await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.TokenTransfer);
        expect(signed).toMatchInlineSnapshot(
          `"83a4008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a310101828258390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098821a00124f80a1581c22222222222222222222222222222222222222222222222222222222a1401a0001e240825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67a10081825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd58409ba10ff0e9fbb15e0fd6ba1ef4b0630519241058f6ca09df17434507986b164952c4f22d58332760d558b005946a28bb11df83d29405fb86a9cf298c0a05360df6"`
        );
        expect(signed).toContain('581c' + '22'.repeat(28) + 'a1401a0001e240'); // policy -> a1 -> "40" (empty name) -> amount
      });

      // No change output: the outputs array is 1 (receiver only) instead of 2.
      it('no change output', async () => {
        const transaction = buildTx(
          { output: { address: RECEIVE_ADDRESS, amount: RECEIVE_LOVELACE, token: TOKEN }, change: undefined },
          false
        );
        expect(adaSDK.getTransactionSize(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(`266`);
        const signed = await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.TokenTransfer);
        expect(signed).toMatchInlineSnapshot(
          `"83a4008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a310101818258390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098821a00124f80a1581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240021a0002a801031a07c33a67a10081825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd5840c70bb5691dd348e3b493b1014d9a90de2a05898a3d430071b30c7a319816643ee56cf4a718949579019fce6df5b4ac929f824841904ef04b68ac9b99dec1ab01f6"`
        );
        expect(signed).toContain('0181825839'); // outputs key 01 + array(1) + first (receiver) output, no change
      });

      // Receiver is an enterprise address (encode type 2, 29 bytes) -> the type-2 address display path.
      it('receiver is an enterprise address', async () => {
        const ENTERPRISE_ADDRESS = 'addr1vyulu6ra4ennas49mn77n4cpxcy7862sdx25f4sw8ea5yhsysacsn';
        const transaction = buildTx(
          { output: { address: ENTERPRISE_ADDRESS, amount: RECEIVE_LOVELACE, token: TOKEN } },
          false
        );
        expect(adaSDK.getTransactionSize(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(`303`);
        const signed = await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.TokenTransfer);
        expect(signed).toMatchInlineSnapshot(
          `"83a4008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a3101018282581d6139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e821a00124f80a1581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67a10081825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd5840a8eabbfa8e55d204261a7c479c9b58efbc1d4152b67584e7c34405701326e80023f0d25c8c9d0a3244151b16a8f336b92ce06bad9bff008fc5b428b32dfbf606f6"`
        );
        // 29-byte enterprise address (581d header, 0x61 = mainnet enterprise) in the receiver output
        expect(signed).toContain('82581d6139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e');

        if (cardType !== CardType.Pro) return;
        const min = TOKEN_TYPE.find((t) => t.symbol === 'MIN')!;
        const txDetail = await getTxDetail(transport, props.appId);
        const expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage('ADA')
          .messagePage(min.signature ? 'MIN' : '@MIN')
          .addressPage(ENTERPRISE_ADDRESS.toLowerCase())
          .amountPage(Number(TOKEN.amount) / 1e6)
          .messagePage('ADA')
          .amountPage(RECEIVE_LOVELACE / 1e6)
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
        expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
      });

      // Change carrying many leftover tokens: exercises the enlarged (2048-byte) change slot and its
      // 2-byte length prefix end-to-end. 10 distinct-policy tokens -> change value ~400 bytes (> 255),
      // so the 2-byte length path is used; well within the 2048 cap.
      it('change carrying many leftover tokens (enlarged change slot)', async () => {
        const manyAssets: TokenAsset[] = Array.from({ length: 10 }, (_, i) => ({
          policyId: (i + 16).toString(16).padStart(2, '0').repeat(28),
          assetName: '4d494e',
          amount: 100000 + i,
        }));
        const transaction = buildTx(
          {
            output: { address: RECEIVE_ADDRESS, amount: RECEIVE_LOVELACE, token: TOKEN },
            change: { address: CHANGE_ADDRESS, amount: CHANGE_AMOUNT, assets: manyAssets },
          },
          false
        );
        expect(adaSDK.getTransactionSize(transaction, TxTypes.TokenTransfer)).toMatchInlineSnapshot(`733`);
        const signed = await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.TokenTransfer);
        expect(signed).toMatchInlineSnapshot(
          `"83a4008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a310101828258390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098821a00124f80a1581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be42821a02f50055aa581c10101010101010101010101010101010101010101010101010101010a1434d494e1a000186a0581c11111111111111111111111111111111111111111111111111111111a1434d494e1a000186a1581c12121212121212121212121212121212121212121212121212121212a1434d494e1a000186a2581c13131313131313131313131313131313131313131313131313131313a1434d494e1a000186a3581c14141414141414141414141414141414141414141414141414141414a1434d494e1a000186a4581c15151515151515151515151515151515151515151515151515151515a1434d494e1a000186a5581c16161616161616161616161616161616161616161616161616161616a1434d494e1a000186a6581c17171717171717171717171717171717171717171717171717171717a1434d494e1a000186a7581c18181818181818181818181818181818181818181818181818181818a1434d494e1a000186a8581c19191919191919191919191919191919191919191919191919191919a1434d494e1a000186a9021a0002a801031a07c33a67a10081825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd5840012942aa709fa70cbe98946b0728eea5b463da7b41aae977b7cfa247a9a40f9c0fc637a682177feab824d26f51f14c866121d0d3d46edb79fab7ecfab92e540ff6"`
        );
        // all 10 change policies land in the body
        manyAssets.forEach((a) => expect(signed).toContain('581c' + a.policyId));
      });
    });

    describe('StakeRegister', () => {
      it('without token', async () => {
        const transaction = buildTx({}, false);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.StakeRegister)).toMatchInlineSnapshot(`361`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.StakeRegister)).toMatchInlineSnapshot(
          `"83a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67048182008200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd58400de999fb40f5c7ab7dcd7796c92deda38fe059359d4d6f576d5b4e682ec8ac6b35870e2838d7416dd5d0ffd52fe367bea18fb3c484802ef47350dbe099af3f01825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d2584044b28cd0159c529c377f0b50f841ccec9eeade3e823d3ab298725d6b51f566100eb124db9fc9874c53ff52c9e42e79bf62dd407817f8f8ade7e3ba4bcf08c20ff6"`
        );
      });

      it('with token', async () => {
        const transaction = buildTx({}, true);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.StakeRegister)).toMatchInlineSnapshot(`441`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.StakeRegister)).toMatchInlineSnapshot(
          `"83a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be42821a02f50055a2581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240581c6ac8ef33b510ec004fe11585f7c5a9f0c07f0c23428ab4f29c1d7d10a1444d454c4418fb021a0002a801031a07c33a67048182008200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd5840bd95d836aaceb365d2710432977bdb1fd135f935d592c17365a65ebc4320b33e41f8b11de1382e98642d063a0e29357fa9741f538b5a1442d9bac9306d246703825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d25840eb0845f484fcea3190a51a294307450cd6c14df475a11e57501989a107ed7b2f2ae58146175415d6478ba4624b4306ddbbd989a7e1c9924660b7172a3f956506f6"`
        );
      });
    });

    describe('StakeRegisterAndDelegate', () => {
      const overrides: Partial<Transaction> = { poolKeyHash: POOL_KEY_HASH };

      it('without token', async () => {
        const transaction = buildTx(overrides, false);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.StakeRegisterAndDelegate)).toMatchInlineSnapshot(`425`);
        // pure-ADA baseline preserved from before the unified change encoding — pins "bytes identical"
        expect(
          await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.StakeRegisterAndDelegate)
        ).toMatchInlineSnapshot(
          `"83a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67048282008200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e09883028200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098581ce4abcf4408584601e7c707a8902996c0c291e1a3c8300b327ae3f6aba10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd58407651721b452fd86599c72bca6b5b04e9e8ec565a86ded61ce7b486df6577e7167aa5ecc2a192cf0dc0e24994063c62e19e751079753cd73df27f8acd45019306825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d2584064b3a468b7d173714c1e6e7bff640d75a4f3d378a9486ce18372385673adacd365904b293508f9d67b7a4a8c5b9c233a23ef3284f201cee73732fc2d53fba10bf6"`
        );

        if (cardType !== CardType.Pro) return;
        const txDetail = await getTxDetail(transport, props.appId);
        const expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage('ADA')
          .messagePage('Delgt')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
        expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
      });

      it('with token', async () => {
        const transaction = buildTx(overrides, true);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.StakeRegisterAndDelegate)).toMatchInlineSnapshot(`505`);
        expect(
          await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.StakeRegisterAndDelegate)
        ).toMatchInlineSnapshot(
          `"83a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be42821a02f50055a2581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240581c6ac8ef33b510ec004fe11585f7c5a9f0c07f0c23428ab4f29c1d7d10a1444d454c4418fb021a0002a801031a07c33a67048282008200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e09883028200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098581ce4abcf4408584601e7c707a8902996c0c291e1a3c8300b327ae3f6aba10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd5840ac2cf3dfb1b830275e0a1ed462da17beafaea640e6320418efbfe0fdc956d4284fd192bb39469f572420404cd2115dc242cce55117b6322adf075485bee91f09825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d258406c0e3adf2028f5527d50a7cdca31ebc922d882d6a7b7d25797acf77d884268fe6ca2dff63e08778c788a70ac69546ecb3f21bddba19f5a1fe4cba33c609b9701f6"`
        );

        if (cardType !== CardType.Pro) return;
        // token in change must not change what the card displays
        const txDetail = await getTxDetail(transport, props.appId);
        const expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage('ADA')
          .messagePage('Delgt')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
        expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
      });
    });

    describe('StakeDelegate', () => {
      const overrides: Partial<Transaction> = { poolKeyHash: POOL_KEY_HASH };

      it('without token', async () => {
        const transaction = buildTx(overrides, false);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.StakeDelegate)).toMatchInlineSnapshot(`391`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.StakeDelegate)).toMatchInlineSnapshot(
          `"83a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67048183028200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098581ce4abcf4408584601e7c707a8902996c0c291e1a3c8300b327ae3f6aba10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd58404f8b54a9017db869c03153378e691fee7d26fe597259a328c17f147e9f0289171348be4cd220217d917d1875d5a88c758347f88a77f2fe0ad9c1acd973b3d502825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d2584028cb9d3b65be1760d04c09d3b319a35c4eb4ddcd7781a7fbe3129b9ae5ce04de6834aac076399fad1200283ef218fde0208b7824648ca08fbc7f9b89f601a402f6"`
        );
      });

      it('with token', async () => {
        const transaction = buildTx(overrides, true);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.StakeDelegate)).toMatchInlineSnapshot(`471`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.StakeDelegate)).toMatchInlineSnapshot(
          `"83a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be42821a02f50055a2581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240581c6ac8ef33b510ec004fe11585f7c5a9f0c07f0c23428ab4f29c1d7d10a1444d454c4418fb021a0002a801031a07c33a67048183028200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098581ce4abcf4408584601e7c707a8902996c0c291e1a3c8300b327ae3f6aba10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd58402b0cb821bf4998992edd568d9b3e8899e3088b263329868b748e0d8284da0c46c2379b0d58f6fd8f332d4c50d1349be9139f4886d9082977c8baf1d2f9f7480e825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d25840d71a2e54ffacca5c52524856523a461e0bf5c6404d6ff4a8548e5f74b557fecc2d77589aa4dbc03fbbe1605bc44f9de783157db59df075efcfd7fbf637dd6504f6"`
        );
      });
    });

    describe('StakeDeregister', () => {
      it('without token', async () => {
        const transaction = buildTx({}, false);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.StakeDeregister)).toMatchInlineSnapshot(`361`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.StakeDeregister)).toMatchInlineSnapshot(
          `"83a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a67048182018200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd584059135e2af27f0fbafbcf41b7e4d65347c0e97a5e297401db672b5aae4e7ba7461205d191cc37c0fd2d6859d668d643c486f8a539239fbaa24532a189b4343007825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d2584091446224678d2a69f458ad56d962da80a4bda9000bb77cb377d4d0ffce549ed1aac152f1038935949bbfe3046574e500b6e63e6f43cee6fd9623075d832acd0ff6"`
        );
      });

      it('with token', async () => {
        const transaction = buildTx({}, true);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.StakeDeregister)).toMatchInlineSnapshot(`441`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.StakeDeregister)).toMatchInlineSnapshot(
          `"83a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be42821a02f50055a2581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240581c6ac8ef33b510ec004fe11585f7c5a9f0c07f0c23428ab4f29c1d7d10a1444d454c4418fb021a0002a801031a07c33a67048182018200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd584078b1d30fe50f3859df88f6c5092704dba2c3d2377bf1e7b9c98af741a1fa469d559860da924a162ba087e5053756860c5da2441908183b559a466bce4a97e00e825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d2584046e40f75ed1d7da30c112e9a0e2283e9b4ad209d14079d3d76dcd4b95cddcd5293beaa92139255cdc8bc00c588b71e0bbfe0cd1bfc27eff788ab756d2cebe60ff6"`
        );
      });
    });

    describe('StakeWithdraw', () => {
      const overrides: Partial<Transaction> = { withdrawAmount: WITHDRAW_AMOUNT };

      it('without token', async () => {
        const transaction = buildTx(overrides, false);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.StakeWithdraw)).toMatchInlineSnapshot(`363`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.StakeWithdraw)).toMatchInlineSnapshot(
          `"83a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a6705a1581de124e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e0981a000f4240a10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd5840399df2b3d18fd2bc2605b3a1ab841a7e3f68d7e0bca61a716f955a6bf8d3171be1853fb336c3b853e070a6b2dc6ab97c48dbac12421a65b17a73d1e28d181a05825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d25840ad4e7573a8f5d8b3b174b762f46280400173d8fe111d318ee6dd2a67258aa006155c17ae80f66b14f839c49408967dee31f1d6d2aa7f7198bce1298038c3a708f6"`
        );
      });

      it('with token', async () => {
        const transaction = buildTx(overrides, true);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.StakeWithdraw)).toMatchInlineSnapshot(`443`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.StakeWithdraw)).toMatchInlineSnapshot(
          `"83a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be42821a02f50055a2581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240581c6ac8ef33b510ec004fe11585f7c5a9f0c07f0c23428ab4f29c1d7d10a1444d454c4418fb021a0002a801031a07c33a6705a1581de124e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e0981a000f4240a10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd58400fd00abe88462c648896b92764019b65403428a75e9342b00365b01d2dea0621b2c2c2294a18badc25c29c1cbe6fa7cb59e0de51367e92fc5d7e6d690f1cc306825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d258406628ae0818b364f90cd0de9892ea55ae143baa2b65264e2f42877ebcb1cb8d3a827577b3260369e48361ca88158f4b8d9c5c6e2060f946807e6110093a84ec00f6"`
        );
      });
    });

    describe('Abstain', () => {
      it('without token', async () => {
        const transaction = buildTx({}, false);
        // client uses this to calculate tx fee
        expect(adaSDK.getTransactionSize(transaction, TxTypes.Abstain)).toMatchInlineSnapshot(`367`);
        // pure-ADA baseline preserved from before the unified change encoding — pins "bytes identical"
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.Abstain)).toMatchInlineSnapshot(
          `"84a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be421a02f50055021a0002a801031a07c33a6704d901028183098200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e0988102a10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd58406335e34f0543f2027cb79025d430eb219eaca98e2d2eeab8cca363f71f24fe88acdba79e9f42880d2ae2e28e4710b65ddafdc708ee1e418e7250aa5550783d06825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d2584079bb80887fb5440a836b7d2d0500a2b96b63e4e081d834cffd82dbbca77fc88e5efde47475b1345687acb0ec7d42479feb5baf2b983ed09a25a8a5c0f32cf70bf5f6"`
        );

        if (cardType !== CardType.Pro) return;
        const txDetail = await getTxDetail(transport, props.appId);
        const expectedTxDetail = new DisplayBuilder()
          .messagePage('TEST')
          .messagePage('ADA')
          .messagePage('Abstain')
          .wrapPage('PRESS', 'BUTToN')
          .finalize();
        expect(txDetail).toEqual(expectedTxDetail.toLowerCase());
      });

      it('with token', async () => {
        const transaction = buildTx({}, true);
        expect(adaSDK.getTransactionSize(transaction, TxTypes.Abstain)).toMatchInlineSnapshot(`447`);
        expect(await get_signed_tx_by_coolwallet_sdk(transaction, TxTypes.Abstain)).toMatchInlineSnapshot(
          `"84a5008182582032f4fd7d5b365f5d14995df23b9737f16f24ef55b95ac33043bf79895b1a5a31010181825839011b01caf7cb598ea512c2a92ab1c30964b2435c8a6ca866d2bddf69946d3bad769f0ef7006e53f77bd40edf8414e6aaa74d2b4d752736be42821a02f50055a2581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240581c6ac8ef33b510ec004fe11585f7c5a9f0c07f0c23428ab4f29c1d7d10a1444d454c4418fb021a0002a801031a07c33a6704d901028183098200581c24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e0988102a10082825820f7d409a67ce45b502f42a49ce8bf8ef19636428c515ae9d961894bfa6341fbfd5840cf6bab0ae77ccb87d329ffe0ebd6c21610229be8a3dace91e29078adb296c2fe327ca0dbf14f2f7c67e921bd5dc227c70b9e8636188ee7034509c246b2bc8e0c825820a1f4068911137da3a62b19a40f9fc860263ba575ed11ae7339904af47c5537d25840abd070325aef76fc4aa6feb957ed3d8c699ff4270195b5409dd068800480f027befa0a3d58919653aaa4e7f8899de540697369a4807d05cad6bdf995e960fa04f5f6"`
        );

        if (cardType !== CardType.Pro) return;
        // token in change must not change what the card displays
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
  });

  describe('Test sign message', () => {
    const sign_tx_by_coolwallet_sdk = async (message: string, rolePath: number = 0) => {
      const messageTransaction: MessageTransaction = {
        receiveAddress:
          'addr1qyulu6ra4ennas49mn77n4cpxcy7862sdx25f4sw8ea5yh3yu4d4xk2aku478dgmuqmuk7s0eh96h63svdtv5qhquzvqu94v7k',
        addrIndex: 0,
        rolePath: rolePath,
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

    it('signMessage with addressIndex 0', async () => {
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
        `"845846a20127676164647265737358390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a166686173686564f446e59388e59b895840a947491e93d58b6fd96e6c754b0c55edfa7f1d167bf9058767ae6b6e7332c721f39c767b790afc4eef8b49ec135327a86a1c7afcbe2fadf33c6fd711429ae800"`
      );
    });

    it('signMessage with stake account', async () => {
      expect(await sign_tx_by_coolwallet_sdk('', 2)).toMatchInlineSnapshot(
        `"845846a20127676164647265737358390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a166686173686564f4405840a5d66f5cbe953b351812ab03ab4890f9ab373859b0d92f4191c713de71862a236f6bfb6aa972b8223647518b38b569522c95199310b3114393f7f8e1f7cf3b0d"`
      );

      expect(await sign_tx_by_coolwallet_sdk('Hello', 2)).toMatchInlineSnapshot(
        `"845846a20127676164647265737358390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a166686173686564f44548656c6c6f5840fcf36c2d0cfd3545a071308cb39284293495f730725dbf5d125e8057ae917a953dd4bb65721a3152cdf34df1026fdfedcf7893c88bdc04bb3e99175d96b3460a"`
      );

      const message =
        'STAR 883119566159 to addr1q9wak8qad35e0yat8f9z8h3an3zzhgchrw3hgz4gxx9xgsmeyvuad4hus4yc5dnrz4hghyg0an2lzs5dlkttk9z356kqgkvz3t 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';
      expect(await sign_tx_by_coolwallet_sdk(message, 2)).toMatchInlineSnapshot(
        `"845846a20127676164647265737358390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a166686173686564f458bd535441522038383331313935363631353920746f206164647231713977616b38716164333565307961743866397a386833616e337a7a6867636872773368677a34677878397867736d6579767561643468757334796335646e727a34686768796730616e326c7a7335646c6b74746b397a3335366b71676b767a337420333161366261623530613834623834333961646366623738366262323032306636383037653665386664613632396234323431313066633762623163366238625840a3886771c17e0bc127ce9684d90e377f8b0eab13043a0d1f7812bc6e7b1d126148740e6834d47974a041e8703e91d830333076573838c87480d5ea261554330b"`
      );

      expect(await sign_tx_by_coolwallet_sdk('哈囉', 2)).toMatchInlineSnapshot(
        `"845846a20127676164647265737358390139fe687dae673ec2a5dcfde9d7013609e3e950699544d60e3e7b425e24e55b53595db72be3b51be037cb7a0fcdcbabea306356ca02e0e098a166686173686564f446e59388e59b89584035929de8329519d8cccae74e862fa0d609ae3d24098333a289e272eb5bfa8ced5ed625e90768de30850e96c59062f611b156147921c4a5e684177a43ef97020e"`
      );
    });
  });
});
