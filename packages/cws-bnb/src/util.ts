import crypto from 'crypto';
import bech32 from 'bech32';

export function publicKeyToAddress(publicKey: string) {
  const hash = sha256ripemd160(publicKey);
  return encodeAddress(hash);
}

function encodeAddress(value:Buffer, prefix = 'bnb') {
  const words = bech32.toWords(value);
  return bech32.encode(prefix, words);
}

function sha256ripemd160(publicKey:string): Buffer {
  const hash = crypto.createHash('SHA256').update(Buffer.from(publicKey, 'hex')).digest();
  return crypto.createHash('ripemd160').update(hash).digest();
}

function sortObject(obj: any): any {
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) return obj.map(sortObject);
  const sortedKeys = Object.keys(obj).sort();
  const result = {};
  sortedKeys.forEach((key) => {
    (result as any)[key] = sortObject(obj[key]);
  });
  return result;
}

export const convertObjectToSignBytes = (obj: any) => Buffer.from(JSON.stringify(sortObject(obj)));

export function combineSignature(canonicalSignature: any): string {
  return canonicalSignature.r + canonicalSignature.s;
}
