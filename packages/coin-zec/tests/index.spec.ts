import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import ZEC from '../src';
import { ScriptType, signTxType } from '../src/config/types';

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
      expect(p2pkh).toMatchInlineSnapshot(`""`);
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
            preTxHash: '75b5c90768f09839c9a58a57740c20f2ece1d2ac2850f920281b950881062024',
            preIndex: 0,
            preValue: '100000',
            sequence: 4294967295,
            addressIndex: 0,
          },
        ],
        output: { address: 't1Z7n9b9y9y9y9y9y9y9y9y9y9y9y9y9y9y', value: '1000' },
        change: { addressIndex: 0, value: '98000' },
      };

      const signedTx = await zecSDK.signTransaction(options);
      expect(signedTx).toMatchInlineSnapshot(`""`);
    });

    it('P2SH', async () => {
      const options: signTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        scriptType: ScriptType.P2SH,
        inputs: [
          {
            preTxHash: '75b5c90768f09839c9a58a57740c20f2ece1d2ac2850f920281b950881062024',
            preIndex: 0,
            preValue: '100000',
            sequence: 4294967295,
            addressIndex: 0,
          },
        ],
        output: { address: 't3Z7n9b9y9y9y9y9y9y9y9y9y9y9y9y9y9y', value: '1000' },
        change: { addressIndex: 0, value: '98000' },
      };

      const signedTx = await zecSDK.signTransaction(options);
      expect(signedTx).toMatchInlineSnapshot(`""`);
    });
  });
});
