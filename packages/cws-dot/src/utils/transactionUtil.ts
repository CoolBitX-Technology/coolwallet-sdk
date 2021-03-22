import { error, transport, apdu } from "@coolwallet/core";
import * as stringUtil from "./stringUtil";
import { assert, bnToU8a, u8aConcat, u8aToBn } from '@polkadot/util';
import BN from 'bn.js';
import { sha256 } from './cryptoUtil';
import * as types from '../config/types';

// type Transport = transport.default;

const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ec = new elliptic.ec("secp256k1");
const { encodeAddress, decodeAddress } = require('@polkadot/keyring');

const MAX_U8 = new BN(2).pow(new BN(8 - 2)).subn(1);
const MAX_U16 = new BN(2).pow(new BN(16 - 2)).subn(1);
const MAX_U32 = new BN(2).pow(new BN(32 - 2)).subn(1);

const BIT_SIGNED = 128;
const BIT_UNSIGNED = 0;


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

export function getFormatNormalTxData(rawData: types.NormalMethod): types.FormatNormalTransferData {

  const callIndex = types.Method.transfer
  const destAddress = Buffer.from(decodeAddress(rawData.method.destAddress)).toString('hex')
  const value = formatValue(rawData.method.value)
  const mortalEra = getMortalEra(rawData.blockNumber, rawData.era)
  const nonce = formatValue(rawData.nonce)
  const tip = formatValue(rawData.tip)
  const specVer = formatVersion(rawData.specVersion)
  const txVer = formatVersion(rawData.transactionVersion)
  const blockHash = rawData.blockHash
  const genesisHash = rawData.genesisHash

  return {
    callIndex,
    destAddress,
    value,
    mortalEra,
    nonce,
    tip,
    specVer,
    txVer,
    blockHash,
    genesisHash
  }

}

export function getMortalEra(blockNumber: string, era: string): string {
  const binaryValue = parseInt(blockNumber).toString(2)
  const power = Math.ceil(Math.log2(parseInt(era)))

  let binaryPower = (power - 1).toString(2)
  if (binaryPower.length / 2 != 0) {
    binaryPower = '0' + binaryPower
  }

  let result = binaryValue.substr(binaryValue.length - power) + binaryPower

  result = parseInt(result, 2).toString(16)
  if (result.length % 2 != 0) {
    result = '0' + result
  }

  const mortalEra = stringUtil.reverse(result)

  return mortalEra
}

export function formatValue(value: string): string {

  const bigValue = BigInt(value)
  let binaryValue = bigValue.toString(2)

  if (bigValue < 64) {
    binaryValue += '00'
  } else if (64 < bigValue && bigValue < (2 ** 14 - 1)) {
    binaryValue += '01'
  } else if ((2 ** 14) < bigValue && bigValue < (2 ** 30 - 1)) {
    binaryValue += '10'
  } else if ((2 ** 30) < bigValue && bigValue < (2 ** 536 - 1)) {
    const length = Math.ceil(bigValue.toString(16).length / 2)
    const addCode = (length - 4).toString(2).padStart(6, '0') + '11'
    binaryValue = binaryValue + addCode
  } else {

  }

  let result = BigInt('0b' + binaryValue).toString(16)
  if (result.length % 2 != 0) {
    result = '0' + result
  }
  const output = stringUtil.reverse(result)
  return output
}

export function formatVersion(value: string): string {
  let hexValue = parseInt(value).toString(16)
  if (hexValue.length % 2 != 0) {
    hexValue = '0' + hexValue
  }
  return stringUtil.reverse(hexValue).padEnd(8, '0')
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
export function getSumitTransaction(fromAddress: string, formatTxData: types.FormatNormalTransferData, signature: string, version: number): string {

  const sumitTx =
    '00' +
    Buffer.from(decodeAddress(fromAddress)).toString('hex') +
    signature +
    formatTxData.mortalEra +
    formatTxData.nonce +
    formatTxData.tip +
    formatTxData.callIndex +
    '00' +
    formatTxData.destAddress +
    formatTxData.value

  const resultTx = addSignedTxLength(addVersion(sumitTx, version))

  return resultTx
}

function addVersion(signedTx: string, version: number, isSigned: boolean = true): string {
  const resultVer = version | (isSigned ? BIT_SIGNED : BIT_UNSIGNED)
  return resultVer.toString(16) + signedTx
}

/**
 * 
 * @param signedTx (hex string): [version][from address][signature][MortalEra][nonce][tip][method]
 * @returns 
 */
function addSignedTxLength(signedTx: string): string {

  const signedTxU8a = Uint8Array.from(Buffer.from(signedTx, 'hex'));
  const _value = signedTxU8a.length
  const result = u8aConcat(getSignedTxLength(_value), signedTxU8a)
  return Buffer.from(result).toString('hex')
}


/**
 * 
 * @param _value signed transaction length
 * @returns 
 */
function getSignedTxLength(_value: BN | BigInt | number): Uint8Array {
  const value = stringUtil.bnToBn(_value);

  if (value.lte(MAX_U8)) {
    return new Uint8Array([value.toNumber() << 2]);
  } else if (value.lte(MAX_U16)) {
    return bnToU8a(value.shln(2).addn(0b01), 16, true);
  } else if (value.lte(MAX_U32)) {
    return bnToU8a(value.shln(2).addn(0b10), 32, true);
  }

  const u8a = bnToU8a(value);
  let length = u8a.length;

  // adjust to the minimum number of bytes
  while (u8a[length - 1] === 0) {
    length--;
  }

  assert(length >= 4, 'Previous tests match anyting less than 2^30; qed');

  return u8aConcat(
    new Uint8Array([
      // substract 4 as minimum (also catered for in decoding)
      ((length - 4) << 2) + 0b11
    ]),
    u8a.subarray(0, length)
  );
}

