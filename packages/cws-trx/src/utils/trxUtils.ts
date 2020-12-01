import { error, transport, apdu } from "@coolwallet/core";
import { handleHex } from "./stringUtil";
import { Transaction, Transport } from '../config/type'; 
import { hexStr2byteArray, byteArray2hexStr } from './cryptoUtils';
import crypto from "crypto";
import { keccak256 } from "./lib";
import { encode58 } from "./base58";
// var bs58 = require('./base58')

export {
  getRawHex, composeSignedTransacton, genEthSigFromSESig, apduForParsignMessage, pubKeyToAddress
};


const R_B58_DICT = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const base58 = require("base-x")(R_B58_DICT);

const rlp = require("rlp");
const elliptic = require('elliptic');
const ec = new elliptic.ec("secp256k1");


/**
 * Get raw payload
 * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
 * value:string, data:string, chainId: number}} transaction
 * @return {Array<Buffer>}
 */
const getRawHex = (transaction: Transaction): Array<Buffer> => {
  const rawData = [];
  rawData.push(transaction.nonce);
  rawData.push(transaction.gasPrice);
  rawData.push(transaction.gasLimit);
  rawData.push(transaction.to); 
  rawData.push(transaction.value);
  rawData.push(transaction.data);
  const raw = rawData.map((d) => {
    const hex = handleHex(d);
    if (hex === "00" || hex === "") {
      return Buffer.allocUnsafe(0);
    }
    return Buffer.from(hex, "hex");
  });
  raw[6] = Buffer.from([transaction.chainId]);
  raw[7] = Buffer.allocUnsafe(0);
  raw[8] = Buffer.allocUnsafe(0);

  const t = rlp.encode(raw);
  if (t.length > 870) throw new error.SDKError(getRawHex.name, 'data too long');
  return raw;
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
const composeSignedTransacton = (payload: Array<Buffer>, v: number, r: string, s: string, chainId: number): string => {
  const vValue = v + chainId * 2 + 8;

  const transaction = payload.slice(0, 6);

  transaction.push(
    Buffer.from([vValue]),
    Buffer.from(r, "hex"),
    Buffer.from(s, "hex")
  );

  const serializedTx = rlp.encode(transaction);
  return `0x${serializedTx.toString("hex")}`;
};

/**
 * @description Generate Canonical Signature from Der Signature
 * @param {{r:string, s:string}} canonicalSignature
 * @param {Buffer} payload
 * @param {String} compressedPubkey hex string
 * @return {Promise<{v: Number, r: String, s: String}>}
 */
const genEthSigFromSESig = async (
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
 * @description APDU Send Raw Data for Segregated Signature
 * @param {Transport} transport
 * @param {Buffer} msgBuf
 * @param {String} p1
 * @return {Function}
 */
// todo : No test case for this function yet, should test later
const apduForParsignMessage = (
  transport: Transport,
  appPrivateKey: string,
  msgBuf: Buffer,
  p1: string
): Function => {
  let rawData = msgBuf.toString("hex");
  rawData = handleHex(rawData);
  return async () => {
    apdu.tx.txPrep(transport, rawData, p1, appPrivateKey);
  }
};

/**
 * @description get APDU set token function
 * @param {String} address
 * @return {Function}
 */
// export const apduSetToken = (contractAddress, symbol, decimals, sn = 1) => async () => {
//   const setTokenPayload = token.getSetTokenPayload(contractAddress, symbol, decimals);
//   await apdu.tx.setCustomToken(setTokenPayload, sn);
// };

/**
 * @description Trim Hex for Address
 * @param {string} hexString expect 32 bytes address in topics
 * @return {string} 20 bytes address + "0x" prefixed
 */
function trimFirst12Bytes(hexString: string): string {
  return "0x".concat(hexString.substr(hexString.length - 40));
}

/**
 * Convert public key to address
 * @param {string} compressedPubkey
 * @return {string}
 */
function pubKeyToAddress(compressedPubkey: string): string {
  const keyPair = ec.keyFromPublic(compressedPubkey, "hex");
  const pubkey = `04${keyPair.getPublic(false, "hex").substr(2)}`;
  console.log("pubkey: " + pubkey)
  // const address = trimFirst12Bytes(keccak256(pubkey));
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
