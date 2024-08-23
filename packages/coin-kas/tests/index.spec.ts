import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import KAS from '../src';
import { ScriptType, SignTxType } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

const kasSDK = new KAS();

const testWalletInfo = {
  mnemonic: 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo card',
  publicKey: '03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef',
  address: 'kaspa:qrdga25hhaz9wd5p3rrcaynxrl0jm9kwze4jyhgdcmqu8cezaa3w7xh9a3xd9',
};

describe('Test KAS SDK', () => {
  let transport: Transport;
  let props: Mandatory;

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, testWalletInfo.mnemonic);
  });

  it('Test Get Address', async () => {
    const addressIndex = 0;
    const address = await kasSDK.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2PK, addressIndex);
    expect(address).toEqual(testWalletInfo.address);
  });

  it.skip('Test Sign Transaction', async () => {
    const signTxType: SignTxType = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      scriptType: ScriptType.P2PK,
      inputs: [
        {
          preIndex: 1,
          preTxHash: '21aa1aff85fc054381f8536d1ab8dbe68f1673a7c67b7ad7816431603c58d32e',
          preValue: "2355557326",
          purposeIndex: 44,
          addressIndex: 0,
        }
      ],
      output: {
        value: "1000",
        address: "kaspa:qq9rmfhgc758j4zquc8yvcngd0qhekt90qqf2czvshvdzdlq7jq8jphmvr028",
      },
      change: {
        value: "2355546146",
        addressIndex: 0,
        purposeIndex: 44,
      }
    };
    const signedTx = await kasSDK.signTransaction(signTxType);
    console.log('>>> signedTx=',signedTx);
  });
});
