import * as stringUtil from './stringUtil';
import * as types from '../config/types';
const { sha3_256 } = require('js-sha3');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
import Web3 from 'web3';
import { RLP } from '../vet/rlp';


const rlp = require('rlp');
const blake2b = require('blake2b');
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

function arrTraverse(arr: Array<any>): string {
  let result = '';
  result += '[';
  for (let j = 0; j < arr.length; j++) {
    const value = arr[j];
    switch (true) {
      case value === null: {
        result += String.raw`\0`;
        break;
      }
      case typeof value === 'string': {
        result += escapeString(value);
        break;
      }
      case Array.isArray(value): {
        result += arrTraverse(value);
        break;
      }
      case typeof value === 'object': {
        result += objTraverse(value);
        break;
      }
      default:
        break;
    }
    result += '.';
  }
  result = result.slice(0, -1);
  result += ']';
  return result;
}

function escapeString(value: string) {
  let newString = String.raw`${value}`;
  newString = newString.replace('\\', '\\\\');
  newString = newString.replace('.', '\\.');
  newString = newString.replace('{', '\\{');
  newString = newString.replace('}', '\\}');
  newString = newString.replace('[', '\\[');
  newString = newString.replace(']', '\\]');
  return newString;
}

const generateFullCanonicalSig = (canonicalSignature: any, phraseToSign: string, compressedPubkey: string) => {
  const keyPair = ec.keyFromPublic(compressedPubkey, 'hex');

  const hashcode = sha3_256.update(phraseToSign).hex();
  const data = Buffer.from(stringUtil.handleHex(hashcode), 'hex');

  // get v
  const recoveryParam = ec.getKeyRecoveryParam(data, canonicalSignature, keyPair.pub);

  let v;
  if (recoveryParam === 0) {
    v = '00';
  } else if (recoveryParam === 1) {
    v = '01';
  } else {
    throw `generateCanonicalSig failed unexpected value of recoveryParam: ${recoveryParam}`;
  }
  const { r } = canonicalSignature; // string
  const { s } = canonicalSignature; // string

  return r + s + v;
};


function objTraverse(obj: any) {
  let result = '';
  result += '{';
  let keys;
  keys = Object.keys(obj);
  keys.sort();
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];
    switch (true) {
      case value === null: {
        result += `${key}.`;
        result += String.raw`\0`;
        break;
      }
      case typeof value === 'string': {
        result += `${key}.`;
        result += escapeString(value);
        break;
      }
      case Array.isArray(value): {
        result += `${key}.`;
        result += arrTraverse(value);
        break;
      }
      case typeof value === 'object': {
        result += `${key}.`;
        result += objTraverse(value);
        break;
      }
      default:
        break;
    }
    result += '.';
  }
  result = result.slice(0, -1);
  result += '}';
  return result;
}

export function generateHashKey(obj: any): string {
  let jsonObject;
  try {
    jsonObject = JSON.parse(obj);
  } catch (error) {
    jsonObject = obj;
  }

  let resultStrReplaced = '';
  const resultStr = objTraverse(jsonObject);
  resultStrReplaced = resultStr.substring(1).slice(0, -1);
  const result = `vet_sendTransaction.${resultStrReplaced}`;
  return result;
}

export const generateRawTx = async (
  canonicalSignature: any,
  payload: string | object,
  publicKey: string
): Promise<object> => {
  const phraseToSign = generateHashKey(payload);
  const signature = generateFullCanonicalSig(canonicalSignature, phraseToSign, publicKey);
  const b64encoded = Buffer.from(signature, 'hex').toString('base64');

  let transaction;
  if (typeof payload === 'object') transaction = payload;
  else transaction = JSON.parse(payload);
  transaction.signature = b64encoded;
  return transaction;
};

export const getRawTx = (transaction: types.Record): any => {
  const raw = []
  const rawData1 = [];
  rawData1.push(transaction.chainTag);
  rawData1.push(transaction.blockRef);
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
  console.log("transaction.gasPriceCoef",transaction.gasPriceCoef)
  rawData2.push(transaction.gasPriceCoef);
  rawData2.push(transaction.gas);
  rawData2.push(transaction.dependsOn);
  rawData2.push(transaction.nonce);

  rawData2.map((d) => {

    const hex = stringUtil.handleHex(d);
    if (hex === '00' || hex === '') {
      raw.push(Buffer.allocUnsafe(0))
      return
    }
    raw.push(Buffer.from(hex, 'hex'));
  });
  raw.push([])

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

export const getRawDelegatorTx = (transaction: types.DelegatorRecord): any => {
  const raw = []
  const rawData1 = [];
  rawData1.push(transaction.chainTag);
  rawData1.push(transaction.blockRef);
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
  rawData2.push(transaction.nonce);

  rawData2.map((d) => {

    const hex = stringUtil.handleHex(d);
    if (hex === '00' || hex === '') {
      raw.push(Buffer.allocUnsafe(0))
      return
    }
    raw.push(Buffer.from(hex, 'hex'));
  });
  raw.push([transaction.reserved?.features])
  // raw.push(Buffer.from(stringUtil.handleHex(transaction.nonce), 'hex'))
  return raw;
};