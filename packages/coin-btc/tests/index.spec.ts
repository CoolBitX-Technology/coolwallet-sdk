import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import BTC from '../src';
import { ScriptType, signTxType } from '../src/config/types';

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
      expect(p2pkh).toMatchInlineSnapshot(`"test"`);
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
});
