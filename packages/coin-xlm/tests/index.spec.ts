import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import * as types from '../src/config/types';
import XLM from '../src';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test XLM SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const xlmSDK = new XLM(types.COIN_SPECIES.XLM);
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

  it('Test Get index 0 address', async () => {
    const address = await xlmSDK.getAddress(transport, props.appPrivateKey, props.appId, types.PROTOCOL.BIP44);
    expect(address).toMatchInlineSnapshot(`"GAMHFD24LF6LASLUPBFTVTDNFBZAPFOWSUXDQ6F5MW6S6UCDCBY2JAWY"`);
  });

  it('Test Get index 1 address', async () => {
    const address = await xlmSDK.getAddress(transport, props.appPrivateKey, props.appId, types.PROTOCOL.SLIP0010);
    expect(address).toMatchInlineSnapshot(`"GD6Q5TIZH6JUZ4MM5ULAB6GWRADEALONNSGMZRIGSDAHYXNJ2INWOP3F"`);
  });

  // it('Test Sign Transfer XLM Transaction', async () => {
  //   const transaction: types.signTxType = {
  //     transport: transport,
  //     appPrivateKey: props.appPrivateKey,
  //     appId: props.appId,
  //     scriptType: ScriptType.P2SH_P2WPKH,
  //     inputs: [
  //       {
  //         preTxHash: 'd1b3f574ef9998d120450eb4d78da1d2d3a67afb96bfc888d026f42c350fc329',
  //         preIndex: 1,
  //         preValue: '9389392',
  //         addressIndex: 1,
  //       },
  //     ],
  //     output: {
  //       address: 'MK1MVNiGd8QLdc6jyvuEhHGXY3i3fDGxoV',
  //       value: '100000',
  //     },
  //     change: {
  //       addressIndex: 1,
  //       value: '9287142',
  //     },
  //   };
  //   const signedTx = await ltcSDK.signTransaction(transaction);
  //   expect(signedTx).toMatchInlineSnapshot(
  //     `"0100000000010129c30f352cf426d088c8bf96fb7aa6d3d2a18dd7b40e4520d19899ef74f5b3d10100000017160014a4cbfeefc7853dc5c51e6b9f112bc797b1d42e1bffffffff02a08601000000000017a91479d546dde735e94b8c062bc79f4d3b1d88ad107c87e6b58d000000000017a914713d81084b5822a00ff848b0d6b15440a769145e8702483045022100a34dccde30b8e596b6295e53cca57b606ad1ff116d48da06e3ed54e9c368e44d02201b6d229cb7a051fbadd2a2765045701e599f9e93143675f72908cdec7c3d5cf10121021c7b8125c6b6dc50f022bc84474d5beb0f18863990cb936cea905bfd9c51a68f00000000"`
  //   );
  // });
});
