import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import ZEC from '../src';
import { ScriptType } from '../src/config/types';
import type { signTxType } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test ZEC SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const zecSDK = new ZEC();
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
      const p2pkh = await zecSDK.getAddress(
        transport,
        props.appPrivateKey,
        props.appId,
        ScriptType.P2PKH,
        ADDRESS_INDEX
      );
      expect(p2pkh).toMatchInlineSnapshot(`"t1V9sXRC68WHVrBqtvG8bCx8Pw6PmXQKTHj"`);
    });

    // it('P2SH', async () => {
    //   const p2sh = await zecSDK.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2SH, ADDRESS_INDEX);
    //   expect(p2sh).toMatchInlineSnapshot(`""`);
    // });
  });

  describe('Test Sign Transfer Tx', () => {
    it('P2PKH', async () => {
      const options: signTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        scriptType: ScriptType.P2PKH,
        inputs: [
          {
            preTxHash: '9452bdd51aea164d92db842616c9979c72fda81553d3b51d7bffa26858eaf437',
            preIndex: 1,
            preValue: '739147',
            sequence: 4294967293,
            addressIndex: 0,
          },
        ],
        output: { address: 't1Vbw17X8y1PBqYw2TxB9dTWTRrginFA9kX', value: '100000' },
        change: { addressIndex: 0, value: '629147' },
      };

      const signedTx = await zecSDK.signTransaction(options);
      expect(signedTx).toMatchInlineSnapshot(
        `"0400008085202f890137f4ea5868a2ff7b1db5d35315a8fd729c97c9162684db924d16ea1ad5bd5294010000006b483045022100cce6895c5cdfdfb0aa8cb77e1aded6d981c1360422193ddb320f524abd700aa402206caaac2313791bc59baca78fb14d56dff08479942b9dfecb242df22c81fbd7c58121024edfc9ffc53b2be653b2ce5771fad8dd57de250c0710618a9cd0f96980ae4787fdffffff02a0860100000000001976a91480aab6125e2949882b48d06cf543ae2e5bf9746388ac9b990900000000001976a9147bbcfe4b425a1b2b8c46904c08ed5b0a7fe49a9888ac00000000000000000000000000000000000000"`
      );
    });
  });
});
