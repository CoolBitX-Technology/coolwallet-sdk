import sha512 from 'js-sha512';
import base32 from 'hi-base32';

const PUBLIC_KEY_LENGTH = 32;
const ALGORAND_ADDRESS_LENGTH = 58;
const ALGORAND_CHECKSUM_BYTE_LENGTH = 4;

function concatArrays(...arrs: ArrayLike<number>[]): Uint8Array {
  const size = arrs.reduce((sum, arr) => sum + arr.length, 0);
  const c = new Uint8Array(size);

  let offset = 0;
  for (let i = 0; i < arrs.length; i++) {
    c.set(arrs[i], offset);
    offset += arrs[i].length;
  }
  return c;
}

const encodeAddress = async (publicKey: string) => {
  const publicKeyBytes = Buffer.from(publicKey, 'hex');
  const checksum = sha512.sha512_256
    .array(publicKeyBytes)
    .slice(PUBLIC_KEY_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH, PUBLIC_KEY_LENGTH);
  const addr = base32.encode(concatArrays(publicKeyBytes, checksum));
  return addr.toString().slice(0, ALGORAND_ADDRESS_LENGTH);
};

export { encodeAddress };
