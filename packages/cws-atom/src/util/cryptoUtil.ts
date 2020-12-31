import crypto from 'crypto';

export function sha256(data: Buffer) {
  const sha256Hash = crypto.createHash('SHA256').update(data).digest();
  return sha256Hash;
}

export function ripemd160(data: Buffer) {
  const ripemd160hash = crypto.createHash('ripemd160').update(data).digest();
  return ripemd160hash;
}
