import { error, transport, apdu } from "@coolwallet/core";
import { handleHex } from "./stringUtil";

const { encodeAddress } = require('@polkadot/keyring');


/**
 * Convert public key to address
 * @param {string} compressedPubkey
 * @return {string}
 */
export function pubKeyToAddress(compressedPubkey: string): string {
  const zero = '0x' + compressedPubkey;
  const address = encodeAddress(zero, 0);
  return address;
}


