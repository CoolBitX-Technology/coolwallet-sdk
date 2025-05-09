import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import * as types from '../src/config/types';
import LTC from '../src';
import { ScriptType } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test LTC SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const ltcSDK = new LTC();
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

  it('Test Get index 0 address', async () => {
    const address = await ltcSDK.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2SH_P2WPKH, 0);
    expect(address).toMatchInlineSnapshot(`"MGHwUnwCnADBxqv5mUjU7Dven6Wa9QybUT"`);
  });

  it('Test Sign Transfer LTC Transaction', async () => {
    const transaction: types.signTxType = {
      transport: transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      scriptType: ScriptType.P2SH_P2WPKH,
      inputs: [
        {
          preTxHash: 'd1b3f574ef9998d120450eb4d78da1d2d3a67afb96bfc888d026f42c350fc329',
          preIndex: 1,
          preValue: '9389392',
          addressIndex: 1,
        },
      ],
      output: {
        address: 'MK1MVNiGd8QLdc6jyvuEhHGXY3i3fDGxoV',
        value: '100000',
      },
      change: {
        addressIndex: 1,
        value: '9287142',
      },
    };
    const signedTx = await ltcSDK.signTransaction(transaction);
    expect(signedTx).toMatchInlineSnapshot(
      `"0100000000010129c30f352cf426d088c8bf96fb7aa6d3d2a18dd7b40e4520d19899ef74f5b3d10100000017160014a4cbfeefc7853dc5c51e6b9f112bc797b1d42e1bffffffff02a08601000000000017a91479d546dde735e94b8c062bc79f4d3b1d88ad107c87e6b58d000000000017a914713d81084b5822a00ff848b0d6b15440a769145e8702483045022100a34dccde30b8e596b6295e53cca57b606ad1ff116d48da06e3ed54e9c368e44d02201b6d229cb7a051fbadd2a2765045701e599f9e93143675f72908cdec7c3d5cf10121021c7b8125c6b6dc50f022bc84474d5beb0f18863990cb936cea905bfd9c51a68f00000000"`
    );
  });
});
