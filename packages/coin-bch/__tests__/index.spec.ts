import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, } from '@coolwallet/testing-library';
import BCH from '../../coin-bch/src';

type PromiseValue<T> = T extends Promise<infer P> ? P : never;

describe('Test BCH SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  const bch = new BCH();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo card';

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    transport = (await createTransport())!;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    props = await initialize(transport, mnemonic);
  });

  it('BCH test get address 0', async () => {
    const addressIndex = 0;
    const address = await bch.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
    expect(address).toMatchInlineSnapshot(`"bitcoincash:qqsykjppczqgptj2pxkyx7vhzldgteer75axzvzqmz"`);
  });

  // it.skip('BCH signTransaction 1', async () => {
  // });

  // it.skip('BCH signTransaction 2', async () => {
  // });
});
