import { utils } from '@noble/secp256k1';

function bytesToBigInt(bytes: Buffer) {
  return BigInt(`0x${bytes.toString('hex')}`);
}

function numTo32bStr(num: number | bigint): string {
  if (BigInt(num) > BigInt(2) ** BigInt(256)) throw new Error('Expected number < 2^256');
  return num.toString(16).padStart(64, '0');
}

const mod = utils.mod;

export { bytesToBigInt, mod, numTo32bStr };
