import { Transport, coin, config } from '../src';
import * as bip39 from 'bip39';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, HDWallet, CURVE } from '@coolwallet/testing-library';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const mnemonic = bip39.generateMnemonic();
const wallet = new HDWallet(CURVE.ED25519);

describe('Test CoolWallet SDK Core Functional', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
    wallet.setMnemonic(mnemonic);
  });

  it('Test derive Curve25519 publicKey', async () => {
    const publicKey = await coin.getPublicKeyByPath(
      transport,
      props.appId,
      props.appPrivateKey,
      config.PathType.CURVE25519
    );
    const expectedPublicKey = Buffer.from(wallet.deriveCurve25519PublicKey()).toString('hex');

    expect(publicKey).toEqual(expectedPublicKey);
  });
});
