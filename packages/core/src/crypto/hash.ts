import crypto from 'crypto';

export function SHA256(data: string) {
  const sha256 = crypto.createHash('sha256');
  return sha256.update(Buffer.from(data, 'hex')).digest();
}
