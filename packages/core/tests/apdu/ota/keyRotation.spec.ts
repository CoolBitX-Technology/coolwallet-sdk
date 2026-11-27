import { CardType, Transport } from '../../../src';
import { getKeyInfo, parseKeyVersions } from '../../../src/apdu/ota/keyRotation';

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
