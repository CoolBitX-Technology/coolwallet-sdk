import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import BTC from '../src';
import { ScriptType, signTxType } from '../src/config/types';
import { getSequences, getVersion, verifySegwitV0Signatures } from './utils/verifySignature';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test BTC SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const btcSDK = new BTC();
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
    it('P2PKH', async () => {
      const p2pkh = await btcSDK.getAddress(
        transport,
        props.appPrivateKey,
        props.appId,
        ScriptType.P2PKH,
        ADDRESS_INDEX
      );
      expect(p2pkh).toMatchInlineSnapshot(`"1CMC68vxfTR6hYiaUNvgmJ6MSfFantVUtT"`);
    });

    it('P2SH_P2WPKH', async () => {
      const p2sh_p2wpkh = await btcSDK.getAddress(
        transport,
        props.appPrivateKey,
        props.appId,
        ScriptType.P2SH_P2WPKH,
        ADDRESS_INDEX
      );
      expect(p2sh_p2wpkh).toMatchInlineSnapshot(`"3GinAbo25NnuZ21crQw9Cd3zCHu3EfHP37"`);
    });

    it('P2WPKH', async () => {
      const p2wpkh = await btcSDK.getAddress(
        transport,
        props.appPrivateKey,
        props.appId,
        ScriptType.P2WPKH,
        ADDRESS_INDEX
      );
      expect(p2wpkh).toMatchInlineSnapshot(`"bc1q03a0tzf3l29rdaxrm96wzsgg5cxx2aluedxwd9"`);
    });

    it('P2TR', async () => {
      const p2tr = await btcSDK.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2TR, ADDRESS_INDEX);
      expect(p2tr).toMatchInlineSnapshot(`"bc1p59m07jx57kz85tkjkj2aszudu67awazfsmssgwpcc07szgd2gxmqnv0dc5"`);
    });
  });

  describe('Sign Transfer Tx', () => {
    it('P2TR(Taproot)', async () => {
      const options: signTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        scriptType: ScriptType.P2TR,
        inputs: [
          {
            preTxHash: '2479b5de0357df633a4c87644a0e472eda4885e95287214f7db218c9c13c4d02',
            preIndex: 0,
            preValue: '37440',
            sequence: 4294967295,
            addressIndex: 0,
          },
        ],
        output: { address: 'bc1p6vmwjc4l8dhs7cfglzjg4am3sjnnpywz7syk8826crahy39d6vaq2duk4m', value: '345' },
        change: { addressIndex: 0, value: '36479' },
        version: 2,
      };

      expect(await btcSDK.signTransaction(options)).toMatchInlineSnapshot(
        `"02000000000101024d3cc1c918b27d4f218752e98548da2e470e4a64874c3a63df5703deb579240000000000ffffffff025901000000000000225120d336e962bf3b6f0f6128f8a48af77184a73091c2f409639d5ac0fb7244add33a7f8e000000000000225120a176ff48d4f5847a2ed2b495d80b8de6bdd7744986e1043838c3fd0121aa41b60140805140e220b4365c885fa7ad15ff86baaf353e9504d99ea0f66a52428e3de73560e8ee709cdbb0f613059c8d5e6c55505cad7e6d94b6862b9e100d3249b786f500000000"`
      );
    });

    it('P2SH_P2WPKH(Custom Segwit)', async () => {
      const options: signTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        scriptType: ScriptType.P2SH_P2WPKH,
        inputs: [
          {
            preTxHash: 'f55c2ca6c985b7bf34e0c451adfb0ae8d05f336f376c5564b2d6d8dc1075a31e',
            preIndex: 1,
            preValue: '34883',
            sequence: 4294967293,
            addressIndex: 0,
          },
        ],
        output: { address: '37DcArQ1icSZKf7oFTosUid28kWBgsLLEz', value: '555' },
        change: { addressIndex: 0, value: '33664' },
        version: 2,
      };

      expect(await btcSDK.signTransaction(options)).toMatchInlineSnapshot(
        `"020000000001011ea37510dcd8d6b264556c376f335fd0e80afbad51c4e034bfb785c9a62c5cf501000000171600147c7af58931fa8a36f4c3d974e14108a60c6577fcfdffffff022b0200000000000017a9143ca1b20af95028ac60b644f6e26ca4d269dfa83c87808300000000000017a914a4df3c0070acd2e1ecf20c7457a8a5c939f98f0687024730440220750d6e6bb54733e90614571f2defbb3525256272a6c961555613ed4ec13010b302206f5c0bd56bccece37bcc1f030cf0fe3ff36dddccfeeecaddc16271fa63a88da7012103eb551a9d4044ca0aba80c03bd931456f718d5981eaf89a70e63be227fa3d044b00000000"`
      );
    });
  });

  // 卡片是用 script argument 裡的 nSequence 自行組 BIP143 preimage 的，而最終交易的該值是 JS 端
  // 序列化出來的。兩邊不一致時交易看起來完全正常、snapshot 也會過，只有廣播時才會被節點以
  // script verify 失敗拒收 —— 所以這裡一律驗簽章而不只比對 snapshot。
  describe('Sign Transfer Tx with RBF disabled (sequence=0xffffffff)', () => {
    const PRE_VALUE = 34883;

    const buildOptions = (sequence: number): signTxType => ({
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      scriptType: ScriptType.P2SH_P2WPKH,
      inputs: [
        {
          preTxHash: 'f55c2ca6c985b7bf34e0c451adfb0ae8d05f336f376c5564b2d6d8dc1075a31e',
          preIndex: 1,
          preValue: String(PRE_VALUE),
          sequence,
          addressIndex: 0,
        },
      ],
      output: { address: '37DcArQ1icSZKf7oFTosUid28kWBgsLLEz', value: '555' },
      change: { addressIndex: 0, value: '33664' },
      version: 2,
    });

    // 這是核心 case：訂單交易（Swap / Lombard BTC 質押）要求 version 維持韌體支援的 2，
    // 但 sequence 用 0xffffffff 以停用 RBF。修正前 SDK 把 preimage 的 nSequence 寫死成
    // 0xfffffffd，導致卡片簽的是另一筆交易，這個 verify 會失敗。
    it('P2SH_P2WPKH: version=2 + sequence=0xffffffff 的簽章驗得過', async () => {
      const signedTx = await btcSDK.signTransaction(buildOptions(0xffffffff));

      expect(getVersion(signedTx)).toBe(2);
      expect(getSequences(signedTx)).toEqual([0xffffffff]);
      expect(verifySegwitV0Signatures(signedTx, [PRE_VALUE])).toBe(true);
    });

    it('P2SH_P2WPKH: version=2 + sequence=0xfffffffd（signal RBF）的簽章驗得過', async () => {
      const signedTx = await btcSDK.signTransaction(buildOptions(0xfffffffd));

      expect(getVersion(signedTx)).toBe(2);
      expect(getSequences(signedTx)).toEqual([0xfffffffd]);
      expect(verifySegwitV0Signatures(signedTx, [PRE_VALUE])).toBe(true);
    });

    // script argument 只有一格 nSequence，卡片會拿它去簽每一筆 input，
    // 所以 sequence 不一致時必須報錯，不能簽出一筆簽章驗不過的交易。
    it('P2SH_P2WPKH: 各 input 的 sequence 不一致時應拋錯', async () => {
      const options = buildOptions(0xffffffff);
      options.inputs = [
        { ...options.inputs[0], sequence: 0xffffffff },
        { ...options.inputs[0], preIndex: 0, sequence: 0xfffffffd },
      ];

      await expect(btcSDK.signTransaction(options)).rejects.toThrow(/same sequence/);
    });
  });
});
