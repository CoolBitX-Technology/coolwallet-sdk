const base58 = require('bs58');

export function pubKeyToAddress(publicKey: string): string {
  const pubKeyBuf = Buffer.from(publicKey, 'hex');
  return base58.encode(pubKeyBuf);
}
