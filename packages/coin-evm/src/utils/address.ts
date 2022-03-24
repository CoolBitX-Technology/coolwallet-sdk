import { ec as EC } from 'elliptic';
import createKeccakHash from 'keccak';
import { CURVE } from '../config/constants';

const secp256k1 = new EC(CURVE);

/**
 * Trim Hex for Address
 *
 * @param {string} hexString expect 32 bytes address in topics
 * @return {string} 20 bytes address + "0x" prefixed
 */
function trimFirst12Bytes(hexString: string): string {
  return `0x${hexString.substring(hexString.length - 40)}`;
}

/**
 * Converts to a checksum address
 *
 * @param {String} address the given HEX address
 * @return {String}
 */
function toChecksumAddress(address: string) {
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address))
    throw new Error('Given address "' + address + '" is not a valid Ethereum address.');

  address = address.toLowerCase().replace(/^0x/i, '');
  const addressHash = createKeccakHash('keccak256').update(address).digest('hex').replace(/^0x/i, '');
  let checksumAddress = '0x';

  for (let i = 0; i < address.length; i++) {
    // If ith character is 8 to f then make it uppercase
    if (parseInt(addressHash[i], 16) > 7) {
      checksumAddress += address[i].toUpperCase();
    } else {
      checksumAddress += address[i];
    }
  }
  return checksumAddress;
}

/**
 * Convert public key to address
 *
 * @param {string} compressedPubkey
 * @return {string}
 */
function pubKeyToAddress(compressedPubkey: string): string {
  const keyPair = secp256k1.keyFromPublic(compressedPubkey, 'hex');
  const pubkey = Buffer.from(keyPair.getPublic(false, 'hex'), 'hex').slice(1);
  const address = trimFirst12Bytes(createKeccakHash('keccak256').update(pubkey).digest('hex'));
  return toChecksumAddress(address);
}

export { pubKeyToAddress };
