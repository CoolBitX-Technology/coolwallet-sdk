import * as stringUtil from './stringUtil';
import { keccak256 } from '../vet/keccak';

const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');

export const pubKeyToAddress = (compressedPubkey: string): string => {
  const keyPair = ec.keyFromPublic(compressedPubkey, 'hex');
  let publicKey = keyPair.getPublic(false, 'hex').substr(2);
  publicKey = Buffer.from(publicKey, 'hex');

  return '0x' + keccak256(publicKey.slice(1)).slice(12).toString('hex');
};

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





