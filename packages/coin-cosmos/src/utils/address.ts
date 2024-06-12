import { bech32 } from 'bech32';
import { sha256, ripemd160 } from './crypto';

function publicKeyToAddress(publicKey: string, prefix: string): string {
  const publicKeyBuf = Buffer.from(publicKey, 'hex');
  const sha256Hash = sha256(publicKeyBuf);
  const ripemd160hash = ripemd160(sha256Hash);
  const words = bech32.toWords(ripemd160hash);
  return bech32.encode(prefix, words);
}

export { publicKeyToAddress };
