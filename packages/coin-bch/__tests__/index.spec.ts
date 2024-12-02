import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import BCH from '../../coin-bch/src';
import * as types from '../src/config/types';

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

  it('BCH signTransaction 1', async () => {
    const signTxObject: types.signTxType = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      scriptType: bch.ScriptType.P2PKH,
      inputs: [
        {
          preTxHash: '1a158298c1c90f3103f4a1ebcff31ec518fcda259f6b3d21fa0ef50b68df31ee',
          preIndex: 1,
          preValue: '62500',
          addressIndex: 1,
        },
      ],
      output: {
        address: 'qp7qjrz80t4e62hyth4r93l5dtekjn6v95le58eyae',
        value: '1000',
      },
      change: {
        addressIndex: 1,
        value: '52500',
      },
    };
    const signedTx = await bch.signTransaction(signTxObject);
    expect(signedTx).toMatchInlineSnapshot(
      `"0100000001ee31df680bf50efa213d6b9f25dafc18c51ef3cfeba1f403310fc9c19882151a010000006a47304402207830707295591416088bfeb557ae4cc4d3bdcf2bf5d6899946868fb8be0bcac802200783ea3ff174cf3c65b16a3c3f27d3d35034490cbf067e262aa1290cc7f49c2d41210340b76f102ea4a4fe4456c81087a0a7074ddb726af74e89808fbadda42538ae9cffffffff02e8030000000000001976a9147c090c477aeb9d2ae45dea32c7f46af3694f4c2d88ac14cd0000000000001976a914c6743db99915013c6a230f502e4dc70f0aa2833388ac00000000"`
    );
  });

  it('BCH signTransaction 2', async () => {
    const signTxObject: types.signTxType = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      scriptType: bch.ScriptType.P2PKH,
      inputs: [
        {
          preTxHash: '263048a31bd12b9324cc35920719ebd47f7fbc802f54d940b873b9cb3ec1c106',
          preIndex: 1,
          preValue: '21325',
          addressIndex: 0,
        },
      ],
      output: {
        address: '3H62dZMmocjZub6y2r18vgrem3EKsELg2p',
        value: '1000',
      },
      change: {
        addressIndex: 0,
        value: '11325',
      },
    };
    const signedTx = await bch.signTransaction(signTxObject);
    expect(signedTx).toMatchInlineSnapshot(
      `"010000000106c1c13ecbb973b840d9542f80bc7f7fd4eb19079235cc24932bd11ba3483026010000006a47304402207f20adf54c53136222d6264739a014f8ac5e8d68e2a19f6a771f9225d213a45e02207e323670d5e2ca03721f07eb471ff70e922441feabe2a731f345cb825432c11b4121037bae8ad5dd171efdc3a911cebd3d31cd2ffb0892cd63dc6eb00ec716ca446504ffffffff02e80300000000000017a914a8e40b4f6cd04ef541888ea2c047e3d8a38ef379873d2c0000000000001976a914204b4821c08080ae4a09ac43799717da85e723f588ac00000000"`
    );
  });
});
