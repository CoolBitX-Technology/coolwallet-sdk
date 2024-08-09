import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import BTC from '../src';
import { ScriptType } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test BTC SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  const btcSDK = new BTC();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
  });

  describe('Test Get Address', () => {
    it('index 0 address', async () => {
      // P2PKH
      const p2pkh = await btcSDK.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2PKH, 0);
      expect(p2pkh).toMatchInlineSnapshot();

      // // P2SH_P2WPKH
      // const p2sh_p2wpkh = await btcSDK.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2SH_P2WPKH, 0);
      // const { address: expected_p2sh_p2wpkh } = bitcoin.payments.p2sh({
      //   redeem: bitcoin.payments.p2wpkh({ pubkey: publicKey }),
      // });
      // expect(p2sh_p2wpkh).toEqual(expected_p2sh_p2wpkh);

      // // P2WPKH
      // const p2wpkh = await btcSDK.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2WPKH, 0);
      // const { address: expected_p2wpkh } = bitcoin.payments.p2wpkh({ pubkey: publicKey });
      // expect(p2wpkh).toEqual(expected_p2wpkh);

      // const address = await btcSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
      // expect(address).toEqual(
      //   'addr1qyulu6ra4ennas49mn77n4cpxcy7862sdx25f4sw8ea5yh3yu4d4xk2aku478dgmuqmuk7s0eh96h63svdtv5qhquzvqu94v7k'
      // );
    });
  });
});
