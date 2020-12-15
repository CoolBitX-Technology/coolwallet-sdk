import { error, transport, apdu } from "@coolwallet/core";
import { handleHex } from "./stringUtil";
import { hexStr2byteArray, byteArray2hexStr } from './cryptoUtils';
import crypto from "crypto";
import { keccak256 } from "./lib";
import { encode58 } from "./base58";

export {
  getArgument, getRawHex, composeSignedTransacton, genTrxSigFromSESig, pubKeyToAddress
};

const elliptic = require('elliptic');
const ec = new elliptic.ec("secp256k1");

const getArgument = (signTxData: any) => {
  return "";
};

const getRawHex = (argument: any) => {
	return Buffer.from(argument);
};

/**
 * @description Compose Signed Transaction
 * @param {Array<Buffer>} payload
 * @param {Number} v
 * @param {String} r
 * @param {String} s
 * @param {number} chainId
 * @return {String}
 */
const composeSignedTransacton = (signTxData: any, v: number, r: string, s: string): string => {
  return '';
};

/**
 * @description Generate Canonical Signature from Der Signature
 * @param {{r:string, s:string}} canonicalSignature
 * @param {Buffer} payload
 * @param {String} compressedPubkey hex string
 * @return {Promise<{v: Number, r: String, s: String}>}
 */
const genTrxSigFromSESig = async (
  canonicalSignature: { r: string; s: string },
  payload: Buffer,
  compressedPubkey: string | undefined = undefined
): Promise<{ v: number; r: string; s: string; }> => {
  const hash = keccak256(payload);
  const data = Buffer.from(handleHex(hash), "hex");
  const keyPair = ec.keyFromPublic(compressedPubkey, "hex");

  // get v
  const recoveryParam = ec.getKeyRecoveryParam(
    data,
    canonicalSignature,
    keyPair.pub
  );
  const v = recoveryParam + 27;
  const { r } = canonicalSignature;
  const { s } = canonicalSignature;

  return { v, r, s };
};

/**
 * Convert public key to address
 * @param {string} compressedPubkey
 * @return {string}
 */
function pubKeyToAddress(compressedPubkey: string): string {
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
  console.log(sha256(sha256(addressByteArray)))
  // const address = bs58check.encode(Buffer.concat([addressBuffer, addressHash]));
  console.log(addressHash)
  const address = encode58(addressByteArray.concat(addressHash))
  return address
}
// function sha256(data: Buffer): Buffer {
//   return crypto.createHash("sha256").update(data).digest();
// }

export function sha256(dataByte: any): any {

  let dataHex = byteArray2hexStr(dataByte);
  console.log("dataHex: " + dataHex)
  let hashHex = crypto.createHash("sha256").update(Buffer.from(dataHex, 'hex')).digest();
  console.log('hashHex: ' + hashHex)
  console.log('hashHex2: ' + hashHex.toString('hex'))
  return hexStr2byteArray(hashHex.toString('hex'))
}
