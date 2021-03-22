import { error, transport, apdu } from "@coolwallet/core";
import * as stringUtil from "./stringUtil";
import { assert, bnToU8a, u8aConcat, u8aToBn } from '@polkadot/util';
import BN from 'bn.js';
import { sha256 } from './cryptoUtil';
import * as types from '../config/types';
import * as dotUtil from './dotUtil';

// type Transport = transport.default;

const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ec = new elliptic.ec("secp256k1");
const { encodeAddress, decodeAddress } = require('@polkadot/keyring');


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



export async function getCompleteSignature(transport: types.Transport, publicKey: string, canonicalSignature: { r: string; s: string; } | Buffer): Promise<string> {
  if (Buffer.isBuffer(canonicalSignature)) {
    return '';
  }
  const { r, s } = canonicalSignature;
  const { signedTx } = await apdu.tx.getSignedHex(transport);
  const keyPair = ec.keyFromPublic(publicKey, "hex");
  const v = ec.getKeyRecoveryParam(
    sha256(Buffer.from(signedTx, 'hex')),
    canonicalSignature,
    keyPair.pub
  );

  const sig = r + s + v.toString().padStart(2, '0');
  return sig
}

/**
                0x
lenget			  4d02
version       84
              00
from address  80f4e3bd716d3f2c32a77a3423a669d8d5864c3a6fb504c281a229d3e4d836cc
signature 	  0188ccf322696d4c5a9dd7dae01d72345dcbd26b9def1789f8cebfe6a143030723be15da6e75cd16618a031516adb93d2ddf71b810ddbff73429e4df08c9b36d81
MortalEra		  9500
nonce		      84
tip			      58
method		  
              call index  0500
                          00
              dest        8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a4813
              value       f6ffffffffff3f01
 * 
 * 
 * @returns 
 */
export function getSubmitTransaction(fromAddress: string, formatTxData: types.FormatTransfer, methodString: string, signature: string, version: number): string {

  const sumitTx =
    '00' +
    Buffer.from(decodeAddress(fromAddress)).toString('hex') +
    signature +
    formatTxData.mortalEra +
    formatTxData.nonce +
    formatTxData.tip +
    methodString

  const resultTx = dotUtil.addSignedTxLength(dotUtil.addVersion(sumitTx, version))

  return '0x' + resultTx
}

// export function getSubmitTransaction2(fromAddress: string, formatTxData: types.FormatNormalTransfer, signature: string, version: number): string {
//   const sumitTx =
//     '00' +
//     Buffer.from(decodeAddress(fromAddress)).toString('hex') +
//     signature +
//     formatTxData.mortalEra +
//     formatTxData.nonce +
//     formatTxData.tip +
//     formatTxData.callIndex +
//     '00' +
//     formatTxData.destAddress +
//     formatTxData.value

//   const resultTx = dotUtil.addSignedTxLength(dotUtil.addVersion(sumitTx, version))

//   return resultTx
// }
