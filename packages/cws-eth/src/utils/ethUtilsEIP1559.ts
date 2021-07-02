import { transport } from '@coolwallet/core';
import { handleHex } from './stringUtil';
import { EIP1559Transaction } from '../config/types';

const Web3 = require('web3');
const rlp = require('rlp');

type Transport = transport.default;

const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ec = new elliptic.ec('secp256k1');

export const getRawHex = (transaction: EIP1559Transaction): Array<Buffer> => {
  const rawData = [];
  rawData.push('01'); // chainId
  rawData.push(transaction.nonce);
  rawData.push(transaction.gasTipCap);
  rawData.push(transaction.gasFeeCap);
  rawData.push(transaction.gasLimit);
  rawData.push(transaction.to);
  rawData.push(transaction.value);
  rawData.push(transaction.data);
  rawData.push('c0'); // empty accessList
  const raw = rawData.map((d) => {
    const hex = handleHex(d);
    if (hex === '00' || hex === '') {
      return Buffer.allocUnsafe(0);
    }
    return Buffer.from(hex, 'hex');
  });

  return raw;
};

export const composeSignedTransacton = (
  payload: Array<Buffer>, v: number, r: string, s: string
): string => {
  const transaction = payload;
  transaction.push(
    Buffer.from([v]),
    Buffer.from(r, 'hex'),
    Buffer.from(s, 'hex')
  );
  const serializedTx = rlp.encode(transaction);
  return `0x02${serializedTx.toString('hex')}`;
};

/**
 * @description Generate Canonical Signature from Der Signature
 * @param {{r:string, s:string}} canonicalSignature
 * @param {Buffer} payload
 * @param {String} compressedPubkey hex string
 * @return {Promise<{v: Number, r: String, s: String}>}
 */
export const genEthSigFromSESig = async (
  canonicalSignature: { r: string; s: string },
  payload: Buffer,
  compressedPubkey: string | undefined = undefined
): Promise<{ v: number; r: string; s: string; }> => {
  const prefixedPayload = Buffer.concat([Buffer.from([2]), payload]);
  const hash = Web3.utils.keccak256(prefixedPayload);
  const data = Buffer.from(handleHex(hash), 'hex');
  const keyPair = ec.keyFromPublic(compressedPubkey, 'hex');

  // get v
  const recoveryParam = ec.getKeyRecoveryParam(
    data,
    canonicalSignature,
    keyPair.pub
  );
  const v = recoveryParam;
  const { r } = canonicalSignature;
  const { s } = canonicalSignature;

  return { v, r, s };
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
export function pubKeyToAddress(compressedPubkey: string): string {
  const keyPair = ec.keyFromPublic(compressedPubkey, "hex");
  const pubkey = `0x${keyPair.getPublic(false, "hex").substr(2)}`;
  const address = trimFirst12Bytes(Web3.utils.keccak256(pubkey));
  return Web3.utils.toChecksumAddress(address);
}

