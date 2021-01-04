import { error, transport, apdu } from "@coolwallet/core";
import { handleHex } from "./stringUtil";
import { hexStr2byteArray, byteArray2hexStr, sha256 } from './cryptoUtils';
import crypto from "crypto";
import { encode58 } from "./base58";
import * as param from '../config/param';
import * as type from '../config/type';

const Web3 = require('web3');
const {
  keccak256,
} = Web3.utils;


const elliptic = require('elliptic');
const ec = new elliptic.ec("secp256k1");

export const getArgument = (signTxData: type.Transaction, addressIndex: number) => {

  const refBlockBytes = signTxData.refBlockBytes;
  const refBlockHash = signTxData.refBlockHash;
  const expiration = signTxData.expiration.toString(16).padStart(20, '0');;
  const ownerAddress = signTxData.contract.ownerAddress;
  const toAddress = signTxData.contract.toAddress;
  const amount = signTxData.contract.amount.toString(16).padStart(20, '0');;
  const timestamp = signTxData.timestamp.toString(16).padStart(20, '0');;

  const argument = refBlockBytes + refBlockHash + expiration + ownerAddress + toAddress + amount + timestamp;

  console.log("argument: " + argument)

  return addPath(argument, addressIndex);
};


function addPath(argument: string, addressIndex: number) {
  const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  const SEPath = `15328000002C800000${param.coinType}8000000000000000${addressIdxHex}`;
  console.log("SEPath: " + SEPath)
  return SEPath + argument;
}
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
