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

export const getNormalTradeArgument = (rawData: type.NormalContract, addressIndex: number) => {

  const refBlockBytes = rawData.refBlockBytes;
  const refBlockHash = rawData.refBlockHash;
  const expiration = rawData.expiration.toString(16).padStart(20, '0');
  const ownerAddress = rawData.contract.ownerAddress;
  const toAddress = rawData.contract.toAddress;
  const amount = rawData.contract.amount.toString(16).padStart(20, '0');
  const timestamp = rawData.timestamp.toString(16).padStart(20, '0');

  const argument = refBlockBytes + refBlockHash + expiration + ownerAddress + toAddress + amount + timestamp;

  console.log("argument: " + argument)

  return addPath(argument, addressIndex);
};

/*
  = "db13" //ref_block_bytes
  + "c752a0b785e46fd5" //ref_block_hash
  + "0000000001768894C1B8" //expiration
  + "4194f71cd9c43718d3b03e62d648ba6d75f461a3bc" //owner_address
  + "000000000000000F4240" //frozen_balance
  + "00000000000000000003" //frozen_duration
  + "01" //resource 
  + "41b9505137f37e1544eee2cd488413ee5cc6a0d0f0" //receiver_address
  + "0000000001768893DA8A"; //timestamp
*/
export const getFreezeArgement = (rawData: type.FreezeContract, addressIndex: number) => {

  const refBlockBytes = rawData.refBlockBytes;
  const refBlockHash = rawData.refBlockHash;
  const expiration = rawData.expiration.toString(16).padStart(20, '0');
  const ownerAddress = rawData.contract.ownerAddress;
  const frozenBalance = rawData.contract.frozenBalance;
  const frozenDuration = rawData.contract.frozenDuration;
  const resource = rawData.contract.resource;
  const receiverAddress = rawData.contract.receiverAddress;
  const timestamp = rawData.timestamp.toString(16).padStart(20, '0');;

  const argument = refBlockBytes + refBlockHash + expiration + ownerAddress + frozenBalance + frozenDuration + resource + receiverAddress + timestamp;

  console.log("argument: " + argument)

  return addPath(argument, addressIndex);
};


/**
  = "59d0" //ref_block_bytes
  + "7156f07a23657d0f" //ref_block_hash
  + "0000000001765F17C510" //expiration
  + "4194f71cd9c43718d3b03e62d648ba6d75f461a3bc" //owner_address
  + "01"//resource
  + "41b9505137f37e1544eee2cd488413ee5cc6a0d0f0" //receiver_address
  + "0000000001765F16E047"; //timestamp
 * @param rawData 
 * @param addressIndex 
 */
export const getUnfreezeArgement = (rawData: type.UnfreezeContract, addressIndex: number) => {

  const refBlockBytes = rawData.refBlockBytes;
  const refBlockHash = rawData.refBlockHash;
  const expiration = rawData.expiration.toString(16).padStart(20, '0');
  const ownerAddress = rawData.contract.ownerAddress;
  const resource = rawData.contract.resource;
  const receiverAddress = rawData.contract.receiverAddress;
  const timestamp = rawData.timestamp.toString(16).padStart(20, '0');;

  const argument = refBlockBytes + refBlockHash + expiration + ownerAddress + resource + receiverAddress + timestamp;

  console.log("argument: " + argument)

  return addPath(argument, addressIndex);
};

/**
    = "b4be" //ref_block_bytes
    + "ca7bcc139680b7cc" //ref_block_hash
    + "0000000001764B9F74B0" //expiration
    + "4194f71cd9c43718d3b03e62d648ba6d75f461a3bc" //owner_address
    + "41b9505137f37e1544eee2cd488413ee5cc6a0d0f0" //vote_address
    + "00000000000000000001" //vote_count
    + "0000000001764B9E8D43"; //timestamp
 * @param rawData 
 * @param addressIndex 
 */
export const getVoteWitnessArgement = (rawData: type.VoteWitnessContract, addressIndex: number) => {

  const refBlockBytes = rawData.refBlockBytes;
  const refBlockHash = rawData.refBlockHash;
  const expiration = rawData.expiration.toString(16).padStart(20, '0');
  const ownerAddress = rawData.contract.ownerAddress;
  const voteAddress = rawData.contract.voteAddress;
  const voteCount = rawData.contract.voteCount;
  const timestamp = rawData.timestamp.toString(16).padStart(20, '0');;

  const argument = refBlockBytes + refBlockHash + expiration + ownerAddress + voteAddress + voteCount + timestamp;

  console.log("argument: " + argument)

  return addPath(argument, addressIndex);
};

/**
  = "608f" //ref_block_bytes
  + "943f6f8f665827bb" //ref_block_hash
  + "0000000001764B9F74B0" //expiration
  + "4194f71cd9c43718d3b03e62d648ba6d75f461a3bc" //owner_address
  + "0000000001764B9E8D43"; //timestamp
 * @param rawData 
 * @param addressIndex 
 */
export const getWithdrawBalanceArgement = (rawData: type.WithdrawBalanceContract, addressIndex: number) => {

  const refBlockBytes = rawData.refBlockBytes;
  const refBlockHash = rawData.refBlockHash;
  const expiration = rawData.expiration.toString(16).padStart(20, '0');
  const ownerAddress = rawData.contract.ownerAddress;
  const timestamp = rawData.timestamp.toString(16).padStart(20, '0');;

  const argument = refBlockBytes + refBlockHash + expiration + ownerAddress + timestamp;

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
