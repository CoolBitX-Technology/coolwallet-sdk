import { coin, info, Transport } from '@coolwallet/core';
import GoSigner, { SignCurve } from '../src';

// Mock the submodules rather than the package entry: core's internal modules import their own
// index (`from '..'`), so mocking '@coolwallet/core' itself would re-enter the factory mid-load.
jest.mock('@coolwallet/core/lib/coin/signData', () => ({ signData: jest.fn() }));
jest.mock('@coolwallet/core/lib/info', () => ({ isSigningOnlyFirmware: jest.fn() }));

const signData = coin.signData as jest.MockedFunction<typeof coin.signData>;
const isSigningOnlyFirmware = info.isSigningOnlyFirmware as jest.MockedFunction<typeof info.isSigningOnlyFirmware>;

const transport = { cardType: 'Go' } as unknown as Transport;
const appId = 'ab'.repeat(20);
const appPrivateKey = '11'.repeat(32);
const signer = new GoSigner(transport, { appId, appPrivateKey });

const path = '32' + '8000002c' + '8000003c' + '80000000' + '00000000' + '00000000';
const digest = '5a'.repeat(32);

beforeEach(() => {
  signData.mockReset();
  isSigningOnlyFirmware.mockReset();
});

describe('SignCurve', () => {
  it('is the same enum as core', () => {
    expect(SignCurve).toBe(coin.SignCurve);
  });
});

describe('isSupported', () => {
  it.each([true, false])('returns core isSigningOnlyFirmware result (%s)', async (supported) => {
    isSigningOnlyFirmware.mockResolvedValue(supported);
    await expect(signer.isSupported()).resolves.toBe(supported);
    expect(isSigningOnlyFirmware).toHaveBeenCalledWith(transport);
  });

  it('propagates errors from the version query', async () => {
    isSigningOnlyFirmware.mockRejectedValue(new Error('BLE disconnected'));
    await expect(signer.isSupported()).rejects.toThrow('BLE disconnected');
  });
});

describe('sign methods', () => {
  const cases: [string, (p: string, d: string) => Promise<unknown>, SignCurve, unknown][] = [
    [
      'signSecp256k1',
      (p, d) => signer.signSecp256k1(p, d),
      SignCurve.SECP256K1,
      { curve: SignCurve.SECP256K1, der: '3006020101020101', r: '01'.padStart(64, '0'), s: '01'.padStart(64, '0') },
    ],
    ['signSchnorr', (p, d) => signer.signSchnorr(p, d), SignCurve.SCHNORR, { curve: SignCurve.SCHNORR, signature: 'cd'.repeat(64) }],
    ['signEd25519', (p, d) => signer.signEd25519(p, d), SignCurve.ED25519, { curve: SignCurve.ED25519, signature: 'ef'.repeat(64) }],
    [
      'signBip32Ed25519',
      (p, d) => signer.signBip32Ed25519(p, d),
      SignCurve.BIP32ED25519,
      { curve: SignCurve.BIP32ED25519, signature: '12'.repeat(64) },
    ],
  ];

  it.each(cases)('%s calls core signData with its curve and returns the result unchanged', async (_, sign, curve, result) => {
    signData.mockResolvedValue(result as never);
    await expect(sign(path, digest)).resolves.toBe(result);
    expect(signData).toHaveBeenCalledTimes(1);
    expect(signData).toHaveBeenCalledWith({ transport, appId, appPrivateKey, path, curve, data: digest });
  });

  it('propagates errors from core signData', async () => {
    signData.mockRejectedValue(new Error('requires CoolWallet Go signing-only firmware'));
    await expect(signer.signEd25519(path, 'aa')).rejects.toThrow('requires CoolWallet Go signing-only firmware');
  });
});
