import { createECDH, createHash } from 'crypto';
import { ec as EC } from 'elliptic';
import { CardType, Transport } from '../../src';
import { changePairingPassword, getPairingPassword } from '../../src/wallet/client';
import { ECIESDec } from '../../src/crypto/encryptions';

const secp256k1 = new EC('secp256k1');
const appKey = secp256k1.keyFromPrivate('11'.repeat(32));
const appPrivateKey = appKey.getPrivate('hex').padStart(64, '0');
const appId = 'ab'.repeat(20);
const nonce = '0102030405060708';

const seKey = createECDH('secp256k1');
seKey.generateKeys();
const SEPublicKey = seKey.getPublicKey('hex');
const SEPrivateKey = seKey.getPrivateKey('hex');

type SentApdu = { command: string; data: string };

const mockTransport = ({
  cardType = CardType.Go,
  seVersion = 102,
  changeStatus = '9000',
  versionResponse,
  versionError,
}: {
  cardType?: CardType;
  seVersion?: number;
  changeStatus?: string;
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
        case '12':
          return changeStatus;
        default:
          return '9000';
      }
    }),
  } as unknown as Transport;
  const changeApdus = () => sent.filter(({ command }) => command.slice(6, 8).toUpperCase() === '12');
  return { transport, changeApdus };
};

describe('getPairingPassword', () => {
  it('rejects a Go card without sending any APDU', async () => {
    const { transport } = mockTransport({ cardType: CardType.Go, seVersion: 102 });
    await expect(getPairingPassword(transport, appId, appPrivateKey)).rejects.toThrow(
      'CoolWallet Go does not support this command.'
    );
    expect(transport.request).not.toHaveBeenCalled();
  });
});

describe('changePairingPassword', () => {
  it('sends the encrypted passwords with the command signature', async () => {
    const { transport, changeApdus } = mockTransport();
    await expect(
      changePairingPassword(transport, appId, appPrivateKey, '12345678', '87654321', SEPublicKey)
    ).resolves.toBeUndefined();

    const apdus = changeApdus();
    expect(apdus).toHaveLength(1);
    // assemblyCommandAndData appends a 1-byte XOR checksum for the transport; drop it.
    const data = apdus[0].data.slice(0, -2);
    // ECIES(65 ephemeral pub + 20 MAC + 16 ciphertext) + appId(20) + signature(72)
    expect(data).toHaveLength((101 + 20 + 72) * 2);

    const encrypted = data.slice(0, 202);
    expect(ECIESDec(SEPrivateKey, encrypted)).toBe('1234567887654321');
    expect(data.slice(202, 242)).toBe(appId);

    const signature = data.slice(242).replace(/^(00)+/, '');
    const signedData = createHash('sha256')
      .update(Buffer.from('80120000' + encrypted + nonce, 'hex'))
      .digest();
    expect(appKey.verify(signedData, signature)).toBe(true);
  });

  it('rejects a Pro card without sending any APDU', async () => {
    const { transport } = mockTransport({ cardType: CardType.Pro, seVersion: 348 });
    await expect(
      changePairingPassword(transport, appId, appPrivateKey, '12345678', '87654321', SEPublicKey)
    ).rejects.toThrow('Only CoolWallet Go supports this command.');
    expect(transport.request).not.toHaveBeenCalled();
  });

  it('rejects Go SE 101 before sending the command', async () => {
    const { transport, changeApdus } = mockTransport({ seVersion: 101 });
    await expect(
      changePairingPassword(transport, appId, appPrivateKey, '12345678', '87654321', SEPublicKey)
    ).rejects.toThrow('Firmware version too low. Please update to 102');
    expect(changeApdus()).toHaveLength(0);
  });

  it('throws the version query error instead of reporting old firmware', async () => {
    const { transport, changeApdus } = mockTransport({ versionResponse: '6D00' });
    const result = changePairingPassword(transport, appId, appPrivateKey, '12345678', '87654321', SEPublicKey);
    await expect(result).rejects.toThrow('returnCode: 6D00');
    await expect(result).rejects.not.toThrow('Firmware version too low');
    expect(changeApdus()).toHaveLength(0);
  });

  it('throws the transport error instead of reporting old firmware', async () => {
    const { transport, changeApdus } = mockTransport({ versionError: new Error('BLE disconnected') });
    const result = changePairingPassword(transport, appId, appPrivateKey, '12345678', '87654321', SEPublicKey);
    await expect(result).rejects.toThrow('BLE disconnected');
    await expect(result).rejects.not.toThrow('Firmware version too low');
    expect(changeApdus()).toHaveLength(0);
  });

  it.each(['123456', '1234567', '123456789', '1234a678', ''])(
    'rejects new password %p without the card',
    async (newPassword) => {
      const { transport } = mockTransport();
      await expect(
        changePairingPassword(transport, appId, appPrivateKey, '12345678', newPassword, SEPublicKey)
      ).rejects.toThrow('newPassword must be 8 digits');
      expect(transport.request).not.toHaveBeenCalled();
    }
  );

  it.each(['123456', '1234567', '123456789', '1234a678', ''])(
    'rejects old password %p without the card',
    async (oldPassword) => {
      const { transport } = mockTransport();
      await expect(
        changePairingPassword(transport, appId, appPrivateKey, oldPassword, '87654321', SEPublicKey)
      ).rejects.toThrow('oldPassword must be 8 digits');
      expect(transport.request).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['6914', 'pin is frozen'],
    ['6915', 'old pair password is wrong'],
    ['6916', 'new pair password format is invalid'],
    ['6917', 'new pair password is the same as the old one'],
    ['6918', 'register data backup is pending'],
  ])('throws the card error %s', async (changeStatus, message) => {
    const { transport } = mockTransport({ changeStatus });
    const result = changePairingPassword(transport, appId, appPrivateKey, '12345678', '87654321', SEPublicKey);
    await expect(result).rejects.toThrow(`returnCode: ${changeStatus}`);
    await expect(result).rejects.toThrow(message);
  });
});
