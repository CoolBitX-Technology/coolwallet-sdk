import * as stringUtil from './stringUtil';
import * as types from '../config/types';
const { sha3_256 } = require('js-sha3');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
import Web3 from 'web3';
import Web3Utils from 'web3-utils';
import { safeToLowerCase } from './scriptUtil';
const fastJsonStableStringify = require('fast-json-stable-stringify')

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

export const getRawTx = (transaction: types.Record): any => {
  const raw = []
  const rawData1 = [];
  rawData1.push(transaction.chainTag);
  rawData1.push(stringUtil.handleHex(transaction.blockRef).replace(/^0+/, ''));
  rawData1.push(transaction.expiration);
  rawData1.map((d) => {
    const hex = stringUtil.handleHex(d);
    if (hex === '00' || hex === '') {
      raw.push(Buffer.allocUnsafe(0))
      return
    }
    raw.push(Buffer.from(hex, 'hex'));
  });

  const rawArrayClauseData = transaction.clauses.map((clause, i) => {
    const rawClauseData = []
    if (clause.to === null) {
      rawClauseData.push('');
    } else {
      rawClauseData.push(clause.to);
    }
    rawClauseData.push(clause.value.toString())
    rawClauseData.push(clause.data)
    return toRaw(rawClauseData)
  })
  raw.push(rawArrayClauseData)

  const rawData2 = []
  rawData2.push(transaction.gasPriceCoef);
  rawData2.push(transaction.gas);
  rawData2.push(transaction.dependsOn);
  rawData2.push(stringUtil.handleHex(transaction.nonce).replace(/^0+/, ''));

  rawData2.map((d) => {

    const hex = stringUtil.handleHex(d);
    if (hex === '00' || hex === '') {
      raw.push(Buffer.allocUnsafe(0))
      return
    }
    raw.push(Buffer.from(hex, 'hex'));
  });

  if (transaction.reserved != null && transaction.reserved.features == 1) {
    raw.push([transaction.reserved.features]);
  } else {
    raw.push([])
  }

  return raw;
};

const toRaw = (value: string[]): Array<Buffer> => {
  return value.map((v) => {
    const hex = stringUtil.handleHex(v);
    if (hex === '00' || hex === '') {
      return Buffer.allocUnsafe(0);
    }
    return Buffer.from(hex, 'hex');
  })
}

export const getCertificateHex = (certificate: types.Certificate): any => {
  const msgHex = fastJsonStableStringify({...certificate, signer: safeToLowerCase(certificate.signer)})
  return stringUtil.handleHex(Web3Utils.toHex(msgHex))
};