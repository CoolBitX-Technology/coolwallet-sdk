import { hexStr2byteArray, byteArray2hexStr, sha256 } from './cryptoUtil';
import { encode58 } from "./base58";
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
  console.log("pubkey: " + pubkey)
  let pubBytes = hexStr2byteArray(pubkey)

  if (pubBytes.length === 65) {
    pubBytes = pubBytes.slice(1);
  }

  const hash = keccak256(pubBytes).toString('hex');
  let addressHex = hash.substring(26);
  addressHex = '41' + addressHex;
  console.log("addressHex: " + addressHex)
  // const addressBuffer = Buffer.from(addressHex)
  const addressByteArray = hexStr2byteArray(addressHex)
  console.log(addressByteArray)

  let msgHex = byteArray2hexStr(addressByteArray);
  const addressHash = sha256(sha256(addressByteArray)).slice(0, 4);
  console.log(addressHash)
  const address = encode58(addressByteArray.concat(addressHash))
  return address
}
