import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import XRP from '../src/index';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test XRP SDK', () => {
  let transport: Transport;
  let cardType: CardType;
  let props: Mandatory;
  const xrpSDK = new XRP();
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
      const address = await xrpSDK.getAddress(transport, props.appPrivateKey, props.appId, 0);
      expect(address).toMatchInlineSnapshot(`"rUFN5unZ7WEA5KcC5v5JN24FJcNFaAL6Wz"`);
    });
  });

  describe('Test Transfer XRP', () => {
    it('transfer with address 0', async () => {
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        payment: {
          TransactionType: 'Payment',
          Flags: 2147483648,
          Sequence: 82710910,
          DestinationTag: 2121215551,
          LastLedgerSequence: 94113337,
          Amount: '100000',
          Fee: '10',
          Destination: 'rwjPKE7LqyYYcccwRoJLuGn7TA1Jyw5c6v',
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await xrpSDK.signTransaction(signData)).toMatchInlineSnapshot(
        `"12000022800000002404EE117E2E7E6F2E3F201B059C0E396140000000000186A068400000000000000A7321035659B8E4B0D46DC5B22F62EF6211206C2F9AA4C28689217BE99FDD5C706516F1744730450221008B3D86039E2266E8850EFB069D8C2FA4DC847DFC918945F53233E3EA0D535924022005A92BE665F501DA3FE3BBE70A5696D142B7CF53ACA0AB05A64A2334E4105F308114819863812B0B9EA1F48EF5297D2F4EE1119BD87283146ABD3AD2BD443171175B7E7FD6C0BF547A6C5A78"`
      );
    });
  });
});
