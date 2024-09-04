import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import BSC from '../src';
import * as types from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test BSC SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const bscSDK = new BSC();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

  beforeAll(async () => {
    if (process.env.CARD === 'lite') {
      cardType = CardType.Lite;
    } else {
      cardType = CardType.Pro;
    }

    if (cardType === CardType.Lite) {
      transport = (await createTransport('http://localhost:9527', CardType.Lite))!;
    } else {
      transport = (await createTransport())!;
    }
    props = await initialize(transport, mnemonic);
  });

  describe('Test Get Address', () => {
    it('index 0 address', async () => {
      const address = await bscSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
      expect(address).toMatchInlineSnapshot(`"0xD636FafC6a63aCb618d367CA1CBa10f660AD8820"`);
    });
  });

  test('Test Sign Transfer BSC Transaction', async () => {
    const transaction: types.signTx = {
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
      },
      addressIndex: 0,
    };
    const signedTx = await bscSDK.signTransaction(transaction);
    expect(signedTx).toMatchInlineSnapshot(
      `"0xf86b81b6843b9aca0082520894c69bfa6ab78853a4addb9b6c553102c7e62ada15865af3107a4000808193a0c7e7b8dd2ed72969c95d0faf548d53126fdcdc85e1f24bc4b971843f668513e7a00b4d3fa381a85c9d0343db49d631505da795a65e63adb205d1e69345b6f66328"`
    );
  });

  test('Test Sign Typed Data', async () => {
    const transaction: types.signTyped = {
      transport: transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      typedData: {
        domain: { name: 'Permit2', chainId: 56, verifyingContract: '0x31c2f6fcff4f8759b3bd5bf0e1084a055615c768' },
        message: {
          details: {
            token: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
            amount: '1461501637330902918203684832716283019655932542975',
            expiration: '1728026642',
            nonce: '0',
          },
          spender: '0x1a0a18ac4becddbd6389559687d1a73d8927e416',
          sigDeadline: '1725436442',
        },
        primaryType: 'PermitSingle',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          PermitSingle: [
            { name: 'details', type: 'PermitDetails' },
            { name: 'spender', type: 'address' },
            { name: 'sigDeadline', type: 'uint256' },
          ],
          PermitDetails: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint160' },
            { name: 'expiration', type: 'uint48' },
            { name: 'nonce', type: 'uint48' },
          ],
        },
      },
      addressIndex: 0,
    };

    const signedTx = await bscSDK.signTypedData(transaction);
    expect(signedTx).toMatchInlineSnapshot(
      `"0xcbc68b8718699a17c45edf08fea1bc08b9aa77337d809a98d2be20fa07a52f576e133299ed96830503f63eaf3167e506fa88c2f9aec4dc1e9c57a13c2356d2481b"`
    );
  });
});
