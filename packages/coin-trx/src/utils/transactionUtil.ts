import { hexStr2byteArray, sha256 } from './cryptoUtil';
import { encode } from "bs58";
const Web3 = require('web3');
const {
  keccak256,
} = Web3.utils;


const elliptic = require('elliptic');
const ec = new elliptic.ec("secp256k1");
/**
 * Convert public key to address
 * @param {string} compressedPubkey
 * @return {string}
 */
export function pubKeyToAddress(compressedPubkey: string): string {
  const keyPair = ec.keyFromPublic(compressedPubkey, "hex");
  const pubkey = `04${keyPair.getPublic(false, "hex").substr(2)}`;
  let pubBytes = hexStr2byteArray(pubkey)

  if (pubBytes.length === 65) {
    pubBytes = pubBytes.slice(1);
  }

  const hash = keccak256(pubBytes).toString('hex');
  let addressHex = hash.substring(26);
  addressHex = '41' + addressHex;
  const addressByteArray = hexStr2byteArray(addressHex)
  const addressHash = sha256(sha256(addressByteArray)).slice(0, 4)
  const address = encode(addressByteArray.concat(addressHash))
  return address
}
