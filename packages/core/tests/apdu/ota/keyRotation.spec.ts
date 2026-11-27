import { CardType, Transport } from '../../../src';
import { getKeyInfo, parseApdu, parseKeyVersions, transmitApdu } from '../../../src/apdu/ota/keyRotation';

const SSD_AID = 'A000000151535041';
const ISD_AID = 'A000000151000000';

// E0 template with one C0 entry (keyId, KVN, AES 16 bytes) for each of keyIds 1-3
const keyInfoOf = (kvn: string) => 'E012' + ['01', '02', '03'].map((keyId) => `C004${keyId}${kvn}8810`).join('');
const SSD_ORIGINAL = keyInfoOf('0A');
const SSD_ROTATED = keyInfoOf('0B');
const ISD_ORIGINAL = keyInfoOf('01');
const ISD_ROTATED = keyInfoOf('02');

type SentApdu = { command: string; data: string };

// command = pid(00) cmdLen(09) CLA INS P1 P2 ...; data ends with a 1-byte XOR checksum.
const insOf = ({ command }: SentApdu) => command.slice(6, 8).toUpperCase();
const aidOf = ({ data }: SentApdu) => data.slice(0, -2).toUpperCase();

const mockTransport = ({
  ssdKeyInfo = SSD_ORIGINAL,
  isdKeyInfo = ISD_ORIGINAL,
  selectStatus = {},
  keyInfoStatus = '9000',
}: {
  ssdKeyInfo?: string;
  isdKeyInfo?: string;
  selectStatus?: Record<string, string>;
  keyInfoStatus?: string;
} = {}) => {
  const sent: SentApdu[] = [];
  let selected = '';
  const transport = {
    cardType: CardType.Pro,
    seVersion: 348,
    request: jest.fn(async (command: string, data: string) => {
      const apdu = { command, data };
      sent.push(apdu);
      switch (insOf(apdu)) {
        case 'A4':
          selected = aidOf(apdu);
          return selectStatus[selected] ?? '9000';
        case 'CA':
          if (keyInfoStatus !== '9000') return keyInfoStatus;
          return (selected === SSD_AID ? ssdKeyInfo : isdKeyInfo) + '9000';
        default:
          return '9000';
      }
    }),
  } as unknown as Transport;
  return { transport, sent };
};

describe('parseKeyVersions', () => {
  it('reads the KVN of every key', () => {
    expect(parseKeyVersions(SSD_ORIGINAL)).toEqual([0x0a, 0x0a, 0x0a]);
  });

  it('reads keys with different KVNs and the extended format', () => {
    // SCP key with KVN 02, and an extended entry (keyType FF) with KVN 70
    const data = 'E00E' + 'C00401028810' + 'C0060170FF880010';
    expect(parseKeyVersions(data)).toEqual([0x02, 0x70]);
  });

  it('reads a template with a two-byte length', () => {
    const entries = 'C00401018810'.repeat(22); // 132 bytes
    expect(parseKeyVersions('E08184' + entries)).toHaveLength(22);
  });

  it.each([
    ['', 'no E0 template'],
    ['C00401018810', 'no E0 template'],
    ['E0', 'no E0 template'],
    ['E007C00401018810', 'length does not match'],
    ['E006C10401018810', 'no C0 entry at byte 2'],
    ['E006C00501018810', 'bad C0 entry at byte 2'],
    ['E000', 'no keys'],
  ])('rejects %p', (data, reason) => {
    expect(() => parseKeyVersions(data)).toThrow(reason);
  });
});

describe('getKeyInfo', () => {
  it('reads the SSD and then the ISD, keeping the status word', async () => {
    const { transport, sent } = mockTransport();
    await expect(getKeyInfo(transport)).resolves.toEqual({
      ssdKeyInfo: SSD_ORIGINAL + '9000',
      isdKeyInfo: ISD_ORIGINAL + '9000',
      isNeedRotateSsdKey: true,
      isNeedRotateIsdKey: true,
    });
    expect(sent.map((apdu) => [insOf(apdu), insOf(apdu) === 'A4' ? aidOf(apdu) : ''])).toEqual([
      ['A4', SSD_AID],
      ['CA', ''],
      ['A4', ISD_AID],
      ['CA', ''],
    ]);
    // GET DATA for the key information template: 80 CA 00 E0
    expect(sent[1].command.slice(4, 12).toUpperCase()).toBe('80CA00E0');
  });

  it.each([
    ['only the SSD rotated', SSD_ROTATED, ISD_ORIGINAL, false, true],
    ['both rotated', SSD_ROTATED, ISD_ROTATED, false, false],
    ['only the ISD rotated', SSD_ORIGINAL, ISD_ROTATED, true, false],
  ])('tells which keys still need rotation when %s', async (_, ssdKeyInfo, isdKeyInfo, ssd, isd) => {
    const { transport } = mockTransport({ ssdKeyInfo, isdKeyInfo });
    await expect(getKeyInfo(transport)).resolves.toMatchObject({
      isNeedRotateSsdKey: ssd,
      isNeedRotateIsdKey: isd,
    });
  });

  it('throws when a security domain cannot be selected', async () => {
    const { transport, sent } = mockTransport({ selectStatus: { [ISD_AID]: '6A82' } });
    await expect(getKeyInfo(transport)).rejects.toThrow('returnCode: 6A82');
    expect(sent.filter((apdu) => insOf(apdu) === 'CA')).toHaveLength(1);
  });

  it('throws when the card does not return the key information', async () => {
    const { transport, sent } = mockTransport({ keyInfoStatus: '6A88' });
    await expect(getKeyInfo(transport)).rejects.toThrow('returnCode: 6A88');
    expect(sent).toHaveLength(2);
  });

  it('throws when the key information cannot be parsed', async () => {
    const { transport } = mockTransport({ ssdKeyInfo: 'E000' });
    await expect(getKeyInfo(transport)).rejects.toThrow('Invalid key information E000');
  });
});

describe('parseApdu', () => {
  const header = { CLA: '80', INS: '50', P1: '00', P2: '00' };
  const challenge = '0102030405060708';

  it.each([
    ['case 1', '80500000', ''],
    ['case 2', '8050000000', ''],
    ['case 3', `8050000008${challenge}`, challenge],
    ['case 4', `8050000008${challenge}00`, challenge],
    ['lower case', `8050000008${challenge}00`.toLowerCase(), challenge],
  ])('reads %s', (_, apdu, data) => {
    expect(parseApdu(apdu)).toEqual({ ...header, data: data.toUpperCase() });
  });

  it('reads the longest command, the token key PUT KEY (151 bytes)', () => {
    const data = 'ab'.repeat(0x91);
    expect(parseApdu(`84D8700191${data}00`)).toEqual({
      CLA: '84',
      INS: 'D8',
      P1: '70',
      P2: '01',
      data: data.toUpperCase(),
    });
  });

  it.each([
    ['', 'Invalid APDU'],
    ['805000', 'Invalid APDU length'],
    ['8050000', 'Invalid APDU'],
    ['8050000z', 'Invalid APDU'],
    [`8050000009${challenge}`, 'Invalid APDU length'], // Lc longer than the data
    [`8050000006${challenge}`, 'Invalid APDU length'], // data longer than Lc and Le
    ['805000000000', 'Invalid APDU length'], // Lc 0
  ])('rejects %p', (apdu, message) => {
    expect(() => parseApdu(apdu)).toThrow(message);
  });
});

describe('transmitApdu', () => {
  const POWER_OFF = '00097F8000000000000000';
  const transportReturning = (responses: string[]) => {
    let index = 0;
    return {
      cardType: CardType.Pro,
      request: jest.fn(async () => {
        const response = responses[index] ?? '9000';
        index += 1;
        return response;
      }),
    } as unknown as Transport;
  };

  it('sends the header and data, and returns data and SW', async () => {
    const transport = transportReturning(['00112233' + '9000']);
    await expect(transmitApdu(transport, '8050000008010203040506070800')).resolves.toBe('001122339000');
    const [command, data] = (transport.request as jest.Mock).mock.calls[0];
    expect(command.slice(4, 12)).toBe('80500000');
    expect(data.slice(0, -2)).toBe('0102030405060708'); // without Lc, Le and the checksum
  });

  it('returns a failing SW without throwing or sending anything else', async () => {
    const transport = transportReturning(['6982']);
    await expect(transmitApdu(transport, '8482110010' + '00'.repeat(16))).resolves.toBe('6982');
    expect(transport.request).toHaveBeenCalledTimes(1);
  });

  it('never inserts a power off between the commands of a session', async () => {
    const transport = transportReturning([]);
    const putKey = '84D80A814B' + '00'.repeat(0x4b) + '00';
    for (let i = 0; i < 4; i += 1) await transmitApdu(transport, putKey);
    const commands = (transport.request as jest.Mock).mock.calls.map(([command]: [string]) => command);
    expect(commands).toHaveLength(4);
    expect(commands).not.toContain(POWER_OFF);
  });
});
