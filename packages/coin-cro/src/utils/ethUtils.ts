const Web3 = require('web3');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');

/**
 * @description Trim Hex for Address
 * @param {string} hexString expect 32 bytes address in topics
 * @return {string} 20 bytes address + "0x" prefixed
 */
 function trimFirst12Bytes(hexString: string): string {
    return '0x'.concat(hexString.substr(hexString.length - 40));
  }

/**
 * Convert public key to address
 * @param {string} compressedPubkey
 * @return {string}
 */
export function pubKeyToAddress(compressedPubkey: string): string {
    const keyPair = ec.keyFromPublic(compressedPubkey, 'hex');
    const pubkey = `0x${keyPair.getPublic(false, 'hex').substr(2)}`;
    const address = trimFirst12Bytes(Web3.utils.keccak256(pubkey));
    return Web3.utils.toChecksumAddress(address);
}