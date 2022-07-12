import crypto from 'crypto';
import { bech32 } from 'bech32';

function sha256(data: Buffer): Buffer {
  return crypto.createHash('SHA256').update(data).digest();
}

function ripemd160(data: Buffer): Buffer {
  return crypto.createHash('ripemd160').update(data).digest();
}

function decodeBech32(data: string): Buffer {
  return Buffer.from(bech32.fromWords(bech32.decode(data).words));
}

export { sha256, ripemd160, decodeBech32 };
