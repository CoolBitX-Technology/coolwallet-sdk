import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import ETC from '../src';
import { Transaction } from '../src/utils'

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test ETC SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const etcSDK = new ETC();
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

  describe('Test Get Address', () => {
    it('index 0 address', async () => {
      const address = await etcSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
      expect(address).toEqual('0x3748b16efdd879f9765add7975f0bec8a1cfdf23');
    });
  });

  describe('Test transfer ETC', () => {
    it('transfer with address 0', async () => {
      const transaction: Transaction = {
        nonce: '279062',
        gasPrice: '1000000000',
        gasLimit: '21000',
        to: '0x925B62293002e05512efdFcdfD2294DEAFA6711E',
        value: '2843171000000000000',
        data: '0x',
        confirmCB: () => {},
        authorizedCB: () => {},
      };
      const tx = await etcSDK.signTransaction(transport, props.appPrivateKey, props.appId, 0, transaction);
      expect(tx).toMatchInlineSnapshot(
        `"0xf873832790628510000000008302100094925b62293002e05512efdfcdfd2294deafa6711e8a0284317100000000000080819ea00e61e2cfb40dde39e214203dcdaacae2fdc19ab1ee6fa8ba7b18d86ec809924fa01493868e8aa14f39f2ca9c5e896055c423d820f9072426d5b1cf91568b7f47cc"`
      );
    });
  });
});
