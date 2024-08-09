import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import BSC, { Transaction, Options, TxTypes } from '../src';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test BSC SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  const bscSDK = new BSC();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

  beforeAll(async () => {
    transport = await createTransport();
    props = await initialize(transport, mnemonic);
  });

  describe('Test Get Address', () => {
    it('index 0 address', async () => {
      const address = await bscSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
      expect(address).toMatchInlineSnapshot(`"0xD636FafC6a63aCb618d367CA1CBa10f660AD8820"`);
    });
  });

  test('Test Sign Transfer BSC Transaction', async () => {
    const transaction: Transaction = {
      transport: transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        nonce: 'b6',
        gasPrice: '3b9aca00',
        gasLimit: '5208',
        to: '0xc69bfA6AB78853A4Addb9b6c553102C7e62Ada15',
        value: '0x5af3107a4000',
        data: '',
        chainId: 56,
      },
      addressIndex: 0,
      confirmCB: () => {},
      authorizedCB: () => {},
    };
    const signedTx = await bscSDK.signTransaction(transaction);
    expect(signedTx).toMatchInlineSnapshot(
      `"0xf86b81b6843b9aca0082520894c69bfa6ab78853a4addb9b6c553102c7e62ada15865af3107a4000808193a0c7e7b8dd2ed72969c95d0faf548d53126fdcdc85e1f24bc4b971843f668513e7a00b4d3fa381a85c9d0343db49d631505da795a65e63adb205d1e69345b6f66328"`
    );
  });
});
