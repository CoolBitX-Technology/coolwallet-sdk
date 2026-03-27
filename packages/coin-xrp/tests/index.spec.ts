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

  describe('Test Transfer XRP with new script', () => {
    it('transfer without flags and destination tag', async () => {
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        payment: {
          TransactionType: 'Payment',
          Sequence: 82710910,
          LastLedgerSequence: 94113337,
          Amount: '100000',
          Fee: '10',
          Destination: 'rwjPKE7LqyYYcccwRoJLuGn7TA1Jyw5c6v',
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await xrpSDK.signTransaction(signData)).toMatchInlineSnapshot(
        `"1200002404EE117E201B059C0E396140000000000186A068400000000000000A7321035659B8E4B0D46DC5B22F62EF6211206C2F9AA4C28689217BE99FDD5C706516F174473045022100F9D55E27D707C1E582F63AEE1D7FD1877C1BA65C1F9D3EA69A2BD7A73BCC3172022059AE14C16A94B32204B9B3B47225107BD3C7DBDD1AEC17306D1F48A8B696AD9F8114819863812B0B9EA1F48EF5297D2F4EE1119BD87283146ABD3AD2BD443171175B7E7FD6C0BF547A6C5A78"`
      );
    });

    it('transfer with memo', async () => {
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex: 0,
        payment: {
          TransactionType: 'Payment',
          Sequence: 82710910,
          LastLedgerSequence: 94113337,
          Amount: '100000',
          Fee: '10',
          Destination: 'rwjPKE7LqyYYcccwRoJLuGn7TA1Jyw5c6v',
          Memos: [
            {
              Memo: {
                MemoData: '31303030303030', // withdraw 金額(1000000)的 hex code
              },
            },
          ],
        },
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await xrpSDK.signTransaction(signData)).toMatchInlineSnapshot(
        `"1200002404EE117E201B059C0E396140000000000186A068400000000000000A7321035659B8E4B0D46DC5B22F62EF6211206C2F9AA4C28689217BE99FDD5C706516F17446304402206E2E146CEA0CC9EE86D914136F8C4C1854A0D11F5C7818ED1E612B77C0ED7EF002207EC0106D0A195E338656810D3AF1DDC0B966EFC26457EA0C8178601BD48B50948114819863812B0B9EA1F48EF5297D2F4EE1119BD87283146ABD3AD2BD443171175B7E7FD6C0BF547A6C5A78F9EA7D0731303030303030E1F2"`
      );
    });
  });

  describe('Test sign message', () => {
    it('sign Hello XRP', async () => {
      const message = 'Hello XRP';
      const signData = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        message,
        addressIndex: 0,
        confirmCB: () => {},
        authorizedCB: () => {},
      };

      expect(await xrpSDK.signMessage(signData)).toMatchInlineSnapshot(
        `"30450221008EBF9D0AA6A38160717CC7774CA9F64D6975C2B814CA1EF7C8A015ED6BA4488B022053231B762184A9534ADF43BF46100CC69CD1E7E4C4140DF11812CCA5BD0C4367"`
      );
    });
  });
});
