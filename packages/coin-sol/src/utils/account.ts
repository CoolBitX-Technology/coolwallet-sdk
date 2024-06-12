import base58 from 'bs58';
import BN from 'bn.js';
import { sha256 } from 'js-sha256';
import * as types from '../config/types';
import { toBase58Buffer } from './stringUtil';
import { is_on_curve } from './ed25519';

const MAX_SEED_LENGTH = 32;

const toBuffer = (arr: Buffer | Uint8Array | Array<number>): Buffer => {
  if (Buffer.isBuffer(arr)) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return Buffer.from(arr);
  }
};

function createProgramAddressSync(seeds: Array<Buffer | Uint8Array>, programId: types.Address): string {
  let buffer = Buffer.alloc(0);
  seeds.forEach(function (seed) {
    if (seed.length > MAX_SEED_LENGTH) {
      throw new TypeError(`Max seed length exceeded`);
    }
    buffer = Buffer.concat([buffer, toBuffer(seed)]);
  });
  buffer = Buffer.concat([buffer, toBase58Buffer(programId), Buffer.from('ProgramDerivedAddress')]);
  const publicKeyBytes = new BN(sha256(buffer), 16).toArray(undefined, 32);
  if (is_on_curve(publicKeyBytes)) {
    throw new Error(`Invalid seeds, address must fall off the curve`);
  }
  return base58.encode(publicKeyBytes);
}

export { createProgramAddressSync };
