const base58 = require('bs58');

export function pubKeyToAddress(publicKey: string): string {
  const pubKey = publicKey.length === 66 ? publicKey.slice(2) : publicKey;

  const pubKeyBuf = Buffer.from(pubKey, 'hex');
  return base58.encode(pubKeyBuf);
}
