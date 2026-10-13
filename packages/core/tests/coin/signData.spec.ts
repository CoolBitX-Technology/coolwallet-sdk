import { createHash } from 'crypto';
import { ec as EC } from 'elliptic';
import { CardType, Transport } from '../../src';
import { signData, SignCurve } from '../../src/coin';
import { convertToDER } from '../../src/crypto/signature';
import { APDUError, SDKError } from '../../src/error/errorHandle';
import { isSigningOnlyFirmware } from '../../src/info';
import { PathType } from '../../src/config';
import { getFullPath } from '../../src/utils';

const secp256k1 = new EC('secp256k1');
const appKey = secp256k1.keyFromPrivate('11'.repeat(32));
const appPrivateKey = appKey.getPrivate('hex').padStart(64, '0');
const appId = 'ab'.repeat(20);
const nonce = '0102030405060708';
const order = secp256k1.curve.n;

const BIP32_PATH = getFullPath({ pathType: PathType.BIP32, pathString: "44'/60'/0'/0/0" });
const BIP340_PATH = getFullPath({ pathType: PathType.BIP340, pathString: "86'/0'/0'/0/0" });
const SLIP0010_PATH = getFullPath({ pathType: PathType.SLIP0010, pathString: "44'/501'/0'/0'" });
const BIP32ED25519_PATH = getFullPath({ pathType: PathType.BIP32ED25519, pathString: "1852'/1815'/0'/0/0" });

type SentApdu = { command: string; data: string };

const mockTransport = ({
  cardType = CardType.Go,
  seVersion = 100,
  signResponse = '',
  signStatus = '9000',
  versionResponse,
  versionError,
}: {
  cardType?: CardType;
  seVersion?: number;
  signResponse?: string;
  signStatus?: string;
  versionResponse?: string;
  versionError?: Error;
} = {}) => {
  const sent: SentApdu[] = [];
  const transport = {
    cardType,
    request: jest.fn(async (command: string, data: string) => {
      sent.push({ command, data });
      // command = pid(00) cmdLen(09) CLA INS P1 P2 ...
      switch (command.slice(6, 8).toUpperCase()) {
        case '52':
          if (versionError) throw versionError;
          return versionResponse ?? seVersion.toString(16).padStart(4, '0') + '9000';
        case '54':
          return nonce + '9000';
        case 'A0':
          return signResponse + signStatus;
        default:
          return '9000';
      }
    }),
  } as unknown as Transport;
  const signDataApdus = () => sent.filter(({ command }) => command.slice(6, 8).toUpperCase() === 'A0');
  return { transport, sent, signDataApdus };
};

const derOf = (r: string, s: string) => convertToDER({ r, s }).toString('hex');

describe('isSigningOnlyFirmware', () => {
  it.each([
    [CardType.Go, 100, true],
    [CardType.Go, 101, true],
    [CardType.Go, 16, false],
    [CardType.Go, 13, false],
    [CardType.Pro, 345, false],
  ])('%s card with SE version %d -> %s', async (cardType, seVersion, expected) => {
    const { transport } = mockTransport({ cardType, seVersion });
    await expect(isSigningOnlyFirmware(transport)).resolves.toBe(expected);
  });

  it('throws instead of reporting old firmware when the transport fails', async () => {
    const { transport } = mockTransport({ versionError: new Error('BLE disconnected') });
    await expect(isSigningOnlyFirmware(transport)).rejects.toThrow('BLE disconnected');
  });

  it.each([
    ['non-9000 status', '6D00'],
    ['empty version with 9000', '9000'],
  ])('throws APDUError on %s', async (_, versionResponse) => {
    const { transport } = mockTransport({ versionResponse });
    await expect(isSigningOnlyFirmware(transport)).rejects.toThrow(APDUError);
  });

  it('does not query the card for non-Go cards', async () => {
    const { transport, sent } = mockTransport({ cardType: CardType.Pro, versionError: new Error('unreachable') });
    await expect(isSigningOnlyFirmware(transport)).resolves.toBe(false);
    expect(sent).toHaveLength(0);
  });
});

describe('signData', () => {
  const digest = '5a'.repeat(32);
  const r = '1f'.repeat(32);
  const s = '2e'.repeat(32);

  describe('APDU', () => {
    it('sends [pathLength][path][data] + appId + command signature with P1 = curve', async () => {
      const { transport, signDataApdus } = mockTransport({ signResponse: derOf(r, s) });
      await signData({ transport, appId, appPrivateKey, path: BIP32_PATH, curve: SignCurve.SECP256K1, data: digest });

      const apdus = signDataApdus();
      expect(apdus).toHaveLength(1);
      const { command, data } = apdus[0];
      // CLA INS P1 P2
      expect(command.slice(4, 12).toUpperCase()).toBe('80A00100');

      const body = (BIP32_PATH.length / 2).toString(16).padStart(2, '0') + BIP32_PATH + digest;
      expect(data.startsWith(body)).toBe(true);
      const rest = data.slice(body.length);
      expect(rest.slice(0, 40)).toBe(appId);
      // 72-byte right-justified signature + 1-byte checksum
      expect(rest.length).toBe(40 + 144 + 2);

      const commandSignature = rest.slice(40, 40 + 144).replace(/^(00)+(?=30)/, '');
      const signedMessage = Buffer.from('80A00100' + body + nonce, 'hex');
      const hash = createHash('sha256').update(signedMessage).digest();
      expect(appKey.verify(hash, commandSignature)).toBe(true);
    });

    it('accepts 0x-prefixed path and data', async () => {
      const { transport, signDataApdus } = mockTransport({ signResponse: derOf(r, s) });
      await signData({
        transport,
        appId,
        appPrivateKey,
        path: `0x${BIP32_PATH}`,
        curve: SignCurve.SECP256K1,
        data: `0x${digest}`,
      });
      expect(signDataApdus()[0].data.startsWith('15' + BIP32_PATH + digest)).toBe(true);
    });
  });

  describe('result', () => {
    it('SECP256K1 returns DER and 32-byte r / s', async () => {
      const { transport } = mockTransport({ signResponse: derOf(r, s) });
      const result = await signData({
        transport,
        appId,
        appPrivateKey,
        path: BIP32_PATH,
        curve: SignCurve.SECP256K1,
        data: digest,
      });
      expect(result).toEqual({ curve: SignCurve.SECP256K1, der: derOf(r, s), r, s });
    });

    it('SECP256K1 pads r / s with a leading-zero byte to 32 bytes', async () => {
      const shortR = '00' + '7f'.repeat(31);
      const shortS = '00' + '3c'.repeat(31);
      const { transport } = mockTransport({ signResponse: derOf(shortR.slice(2), shortS.slice(2)) });
      const result = await signData({
        transport,
        appId,
        appPrivateKey,
        path: BIP32_PATH,
        curve: SignCurve.SECP256K1,
        data: digest,
      });
      expect(result.r).toBe(shortR);
      expect(result.s).toBe(shortS);
    });

    it('SECP256K1 normalizes a high-S signature to low-S', async () => {
      const highS = order.subn(5).toString(16).padStart(64, '0');
      const lowS = '05'.padStart(64, '0');
      const { transport } = mockTransport({ signResponse: derOf(r, highS) });
      const result = await signData({
        transport,
        appId,
        appPrivateKey,
        path: BIP32_PATH,
        curve: SignCurve.SECP256K1,
        data: digest,
      });
      expect(result.s).toBe(lowS);
      expect(result.der).toBe(derOf(r, '05'));
    });

    it.each([
      [SignCurve.SCHNORR, BIP340_PATH, digest],
      [SignCurve.SCHNORR, BIP32_PATH, digest],
      [SignCurve.ED25519, SLIP0010_PATH, 'aa'.repeat(300)],
      [SignCurve.BIP32ED25519, BIP32ED25519_PATH, 'bb'],
    ])('%s returns the 64-byte signature as is', async (curve, path, data) => {
      const signature = 'cd'.repeat(64);
      const { transport } = mockTransport({ signResponse: signature });
      const result = await signData({ transport, appId, appPrivateKey, path, curve, data });
      expect(result).toEqual({ curve, signature });
    });

    it('throws when the card returns a signature of unexpected length', async () => {
      const { transport } = mockTransport({ signResponse: 'cd'.repeat(63) });
      await expect(
        signData({ transport, appId, appPrivateKey, path: SLIP0010_PATH, curve: SignCurve.ED25519, data: 'aa' })
      ).rejects.toThrow(SDKError);
    });

    it('throws APDUError when the card returns non-9000', async () => {
      const { transport } = mockTransport({ signStatus: '6A86' });
      await expect(
        signData({ transport, appId, appPrivateKey, path: BIP32_PATH, curve: SignCurve.SECP256K1, data: digest })
      ).rejects.toThrow(APDUError);
    });
  });

  describe('firmware check', () => {
    it.each([
      [CardType.Go, 16],
      [CardType.Pro, 345],
    ])('rejects %s card with SE version %d before sending SIGN_DATA', async (cardType, seVersion) => {
      const { transport, signDataApdus } = mockTransport({ cardType, seVersion });
      await expect(
        signData({ transport, appId, appPrivateKey, path: BIP32_PATH, curve: SignCurve.SECP256K1, data: digest })
      ).rejects.toThrow('requires CoolWallet Go signing-only firmware');
      expect(signDataApdus()).toHaveLength(0);
    });

    it('surfaces a failed version query instead of reporting old firmware', async () => {
      const { transport, signDataApdus } = mockTransport({ versionError: new Error('BLE disconnected') });
      const result = signData({
        transport,
        appId,
        appPrivateKey,
        path: BIP32_PATH,
        curve: SignCurve.SECP256K1,
        data: digest,
      });
      await expect(result).rejects.toThrow('BLE disconnected');
      await expect(result).rejects.not.toThrow('requires CoolWallet Go signing-only firmware');
      expect(signDataApdus()).toHaveLength(0);
    });
  });

  describe('parameter check', () => {
    const cases: [string, SignCurve, string, string][] = [
      ['unknown curve', '04' as SignCurve, BIP32_PATH, digest],
      ['path not hex', SignCurve.SECP256K1, 'zz', digest],
      ['empty path', SignCurve.SECP256K1, '', digest],
      ['path with a partial index', SignCurve.SECP256K1, BIP32_PATH + '00', digest],
      ['path deeper than 5 indices', SignCurve.SECP256K1, BIP32_PATH + '00000000', digest],
      ['path longer than the 1-byte length field', SignCurve.ED25519, '10' + '80000000'.repeat(64), 'aa'],
      ['SECP256K1 with SLIP0010 path', SignCurve.SECP256K1, SLIP0010_PATH, digest],
      ['SCHNORR with SLIP0010 path', SignCurve.SCHNORR, SLIP0010_PATH, digest],
      ['ED25519 with BIP32 path', SignCurve.ED25519, BIP32_PATH, 'aa'],
      ['BIP32ED25519 with SLIP0010 path', SignCurve.BIP32ED25519, SLIP0010_PATH, 'aa'],
      ['SECP256K1 with 31-byte digest', SignCurve.SECP256K1, BIP32_PATH, 'aa'.repeat(31)],
      ['SCHNORR with 33-byte digest', SignCurve.SCHNORR, BIP340_PATH, 'aa'.repeat(33)],
      ['ED25519 with empty message', SignCurve.ED25519, SLIP0010_PATH, ''],
      ['data not hex', SignCurve.ED25519, SLIP0010_PATH, 'abc'],
    ];

    it.each(cases)('rejects %s without touching the card', async (_, curve, path, data) => {
      const { transport, sent } = mockTransport();
      await expect(signData({ transport, appId, appPrivateKey, path, curve, data })).rejects.toThrow(SDKError);
      expect(sent).toHaveLength(0);
    });

    it('accepts the longest message that fits in one APDU and rejects one byte more', async () => {
      // 2047 - 92 (appId + signature) - 1 (pathLength) - path
      const maxLength = 2047 - 92 - 1 - SLIP0010_PATH.length / 2;
      const { transport } = mockTransport({ signResponse: 'cd'.repeat(64) });
      await expect(
        signData({
          transport,
          appId,
          appPrivateKey,
          path: SLIP0010_PATH,
          curve: SignCurve.ED25519,
          data: 'aa'.repeat(maxLength),
        })
      ).resolves.toBeDefined();
      await expect(
        signData({
          transport,
          appId,
          appPrivateKey,
          path: SLIP0010_PATH,
          curve: SignCurve.ED25519,
          data: 'aa'.repeat(maxLength + 1),
        })
      ).rejects.toThrow(`max ${maxLength} bytes`);
    });
  });
});
