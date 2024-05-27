import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import TON from '../src';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

const tonSDK = new TON();

const testWalletInfo = {
  mnemonic: 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract',
  publicKey: 'c019f0da6fd33f03d125a64899f1a1697d9ce22a1e91477d078dfc9614ba2ae1',
  address: 'EQD87WwPU6bw4WJ9vQyfgnxHy6hWbJg0LQRcBxhi95WErH5V',
};

describe('Test TON SDK', () => {
  let transport: Transport;
  let props: Mandatory;

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, testWalletInfo.mnemonic);
  });

  it('Test Get Address', async () => {
    const addressIndex = 0;
    const address = await tonSDK.getAddress(transport, props.appPrivateKey, props.appId, addressIndex);
    expect(address).toEqual(testWalletInfo.address);
  });
});
