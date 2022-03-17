import * as forger from '@taquito/local-forging';
import { ProtocolsHash } from '@taquito/local-forging';
import { hexString } from '../config/types';
import { blake2b } from './cryptoUtil';

const ProtocolHash = ProtocolsHash.PtHangz2;

/**
 * Convert public key (hex) to address (b58c)
 * Currently, only Ed25519 is supported
 * @param {hexString} compressedPubkey - public key (hex)
 * @returns {string} address (b58c)
 */
export function pubKeyToAddress(compressedPubkey: hexString): string {
  const pkDig = blake2b(compressedPubkey, 20);
  const addressStr = forger.getCodec(forger.CODEC.TZ1, ProtocolHash).decoder(pkDig);
  return addressStr;
}

/**
 * Convert address (b58c) to address (hex)
 * tz1 address (hex) starts with 0x0000
 * tz2 address (hex) starts with 0x0001
 * tz3 address (hex) starts with 0x0002
 * KT1 address (hex) starts with 0x01 and ends with 0x00
 * @param {string} address - address (b58c)
 * @returns {hexString} - address (hex)
 */
 export function addressStrToHex(addressHash: string): hexString {
  const addressHex = forger.getCodec(forger.CODEC.ADDRESS, ProtocolHash).encoder(addressHash);
  return addressHex;
}

/**
 * Convert public key (hex) to public key (b58c)
 * Currently, only Ed25519 is supported
 * @param {hexString} compressedPubkey - public key (hex)
 * @returns {string} public key (b58c)
 */
 export function pubKeyHexToStr(compressedPubkey: hexString): string {
  const pubkeyStr = forger.getCodec(forger.CODEC.PUBLIC_KEY, ProtocolHash).decoder('00'.concat(compressedPubkey));
  return pubkeyStr;
}

/**
 * Convert public key (b58c) to public key (hex)
 * @param {string} pubKeyHash - public key (b58c)
 * @returns {string} public key (hex)
 */
 export function pubKeyStrToHex(pubKeyHash: string): hexString {
  const pubKeyHex = forger.getCodec(forger.CODEC.PUBLIC_KEY, ProtocolHash).encoder(pubKeyHash);
  return pubKeyHex;
}

/**
 * Convert branch (b58c) to branch (hex)
 * @param {string} branchStr - branch (b58c)
 * @returns {string} branch (hex)
 */
 export function branchHashToHex(branchStr: string): hexString {
  const branchHex = forger.getCodec(forger.CODEC.BRANCH, ProtocolHash).encoder(branchStr);
  return branchHex;
}