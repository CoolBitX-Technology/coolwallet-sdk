import { apdu } from "@coolwallet/core";
//import { TezosToolkit } from '@taquito/taquito';
import * as forger from '@taquito/local-forging'
import { blake2b } from './cryptoUtil';
import * as strUtil from './stringUtil';
//import * as types from '../config/types';
//import * as dotUtil from './dotUtil';
//import * as params from '../config/params';

// type Transport = transport.default;

//const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
//const ec = new elliptic.ec("ed25519");
//const { encodeAddress, decodeAddress } = require('@polkadot/keyring');
//const bs58 = require('bs58')
/**
 * Convert public key to address
 * @param {string} compressedPubkey
 * @return {string}
 */
export function pubKeyToAddress(compressedPubkey: string): string {
  const pkDig = blake2b(compressedPubkey, 20);
  const address = forger.getCodec(forger.CODEC.TZ1).decoder(pkDig);
  return address;
}

/**
 * Convert public key hex to hash
 * @param {string} public key hex
 * @return {string}
 */
 export function addressHashToHex(addressHash: string): string {
  const addressHex = forger.getCodec(forger.CODEC.ADDRESS).encoder(addressHash);
  return addressHex;
}

/**
 * Convert public key hex to hash
 * @param {string} public key hex
 * @return {string}
 */
 export function pubKeyHexToHash(compressedPubkey: string): string {
  const pubkeyHash = forger.getCodec(forger.CODEC.PUBLIC_KEY).decoder('00'.concat(compressedPubkey));
  return pubkeyHash;
}

/**
 * Convert public key hash to hex
 * @param {string} public key hash
 * @return {string}
 */
 export function pubKeyHashToHex(pubKeyHash: string): string {
  const pubKeyHex = forger.getCodec(forger.CODEC.PUBLIC_KEY).encoder(pubKeyHash);
  return pubKeyHex;
}

/**
 * Convert branch hash to hex
 * @param {string} branch hash
 * @return {string}
 */
 export function branchHashToHex(branchHash: string): string {
  const branchHex = forger.getCodec(forger.CODEC.BRANCH).encoder(branchHash);
  return branchHex;
}