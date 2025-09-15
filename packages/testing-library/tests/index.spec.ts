import base58Check from 'bs58check';
import { HDWallet, CURVE } from '../src';
import BIP32ECDSA from './fixtures/bip32_ecdsa.json';
import BIP32ED25519 from './fixtures/bip32_ed25519.json';
import DisplayBuilder from '../src/se-tools/display';

const PUBLIC_KEY_SIZE = 33;
const PRIVATE_KEY_SIZE = 32;

function base58KeyToHex(key: string) {
  const KEY_SIZE = key.startsWith('xprv') ? PRIVATE_KEY_SIZE : PUBLIC_KEY_SIZE;
  return Buffer.from(base58Check.decode(key)).slice(-KEY_SIZE).toString('hex');
}

describe('Test Custom HDWallet', () => {
  // Testing Secp256k1 Curve HDWallet
  describe.each(BIP32ECDSA)('Test Secp256k1 Wallet with $name', (ECDSA) => {
    const wallet = new HDWallet(CURVE.SECP256K1);
    wallet.setSeed(Buffer.from(ECDSA.seed, 'hex'));
    it('deriving path m', async () => {
      expect(wallet.masterNode.getPrivateKeyHex()).toEqual(base58KeyToHex(ECDSA.prvKey));
      const publicKey = await wallet.masterNode.getPublicKeyHex();
      expect(publicKey).toEqual(base58KeyToHex(ECDSA.pubKey));
    });
    it.each(ECDSA.paths)('deriving path $path', async (expected) => {
      const node = wallet.derivePath(expected.path);
      expect(node.getPrivateKeyHex()).toEqual(base58KeyToHex(expected.prvKey));
      const nodePublicKey = await node.getPublicKeyHex();
      expect(nodePublicKey).toEqual(base58KeyToHex(expected.pubKey));
    });
  });

  // Testing ED25519 Curve HDWallet
  describe.each(BIP32ED25519)('Test ED25519 Wallet with $name', (ED25519) => {
    const wallet = new HDWallet(CURVE.ED25519);
    wallet.setSeed(Buffer.from(ED25519.seed, 'hex'));
    it('deriving path m', async () => {
      expect(wallet.masterNode.getPrivateKeyHex()).toEqual(ED25519.prvKey);
      const publicKey = await wallet.masterNode.getPublicKeyHex();
      expect(publicKey).toEqual(ED25519.pubKey);
    });
    it.each(ED25519.paths)('deriving path $path', async (expected) => {
      const node = wallet.derivePath(expected.path);
      expect(node.getPrivateKeyHex()).toEqual(expected.prvKey);
      const nodePublicKey = await node.getPublicKeyHex();
      expect(nodePublicKey).toEqual(expected.pubKey);
    });
  });
});

describe('DisplayBuilder.amountPage', () => {
  it.each`
    amount               | expectedInteger | expectedDecimal
    ${0}                 | ${'00000000'}   | ${'00000000'}
    ${1}                 | ${'00000001'}   | ${'00000000'}
    ${123.456}           | ${'00000123'}   | ${'45600000'}
    ${12345678.12345678} | ${'12345678'}   | ${'12345678'}
    ${0.00000001}        | ${'00000000'}   | ${'00000001'}
    ${99999999.99999999} | ${'99999999'}   | ${'99999999'}
    ${100000000}         | ${'00000000'}   | ${'00000000'}
    ${0.12345678}        | ${'00000000'}   | ${'12345678'}
    ${1.00000001}        | ${'00000001'}   | ${'00000001'}
  `('should format amount $amount correctly', ({ amount, expectedInteger, expectedDecimal }) => {
    const builder = new DisplayBuilder();
    builder.amountPage(amount);
    const result = builder.finalize();
    const amountPayload = result.slice(6, 22);
    expect(amountPayload).toBe(expectedInteger + expectedDecimal);
  });
});
