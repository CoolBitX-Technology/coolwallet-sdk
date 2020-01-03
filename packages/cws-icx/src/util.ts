const sha3_256 = require('js-sha3').sha3_256;
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');

export const pubKeyToAddress = (compressedPubkey:string): string => {
  let keyPair = ec.keyFromPublic(compressedPubkey, "hex");
  let publicKey = keyPair.getPublic(false, "hex").substr(2);
  publicKey = Buffer.from(publicKey, "hex");

  let address = "hx" + sha3_256(publicKey).slice(-40);
  return address;
};

export const generateRawTx = async (canonicalSignature: any, payload:string|object, publicKey:string) : Promise<object> => {
  const phraseToSign = generateHashKey(payload);
  const signature = generateFullCanonicalSig(canonicalSignature, phraseToSign, publicKey); //signature and recovery
  const b64encoded = Buffer.from(signature, 'hex').toString('base64');

  let transaction;
  if (typeof payload === 'object') transaction = payload;
  else transaction = JSON.parse(payload);
  transaction.signature = b64encoded;
  return transaction;
};

export function generateHashKey(obj:any): string {
  let jsonObject;
  try {
    jsonObject = JSON.parse(obj);
  } catch (error) {
    jsonObject = obj;
  }

  let resultStrReplaced = '';
  let resultStr = objTraverse(jsonObject);
  resultStrReplaced = resultStr.substring(1).slice(0, -1);
  const result = 'icx_sendTransaction.' + resultStrReplaced;
  return result;
}

function objTraverse(obj:any) {
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

function arrTraverse(arr:Array<any>):string {
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

function escapeString(value:string) {
  let newString = String.raw`${value}`;
  newString = newString.replace('\\', '\\\\');
  newString = newString.replace('.', '\\.');
  newString = newString.replace('{', '\\{');
  newString = newString.replace('}', '\\}');
  newString = newString.replace('[', '\\[');
  newString = newString.replace(']', '\\]');
  return newString;
}

const generateFullCanonicalSig = (canonicalSignature:any, phraseToSign:string, compressedPubkey:string) => {
  
  let keyPair = ec.keyFromPublic(compressedPubkey, 'hex');

  const hashcode = sha3_256.update(phraseToSign).hex();
  const data = Buffer.from(handleHex(hashcode), 'hex');

  // get v
  let recoveryParam = ec.getKeyRecoveryParam(data, canonicalSignature, keyPair.pub);

  let v;
  if (recoveryParam === 0) {
    v = '00';
  } else if (recoveryParam === 1) {
    v = '01';
  } else {
    throw 'generateCanonicalSig failed unexpected value of recoveryParam: ' + recoveryParam;
  }
  let r = canonicalSignature.r; //string
  let s = canonicalSignature.s; //string

  return r + s + v;
  
};

export const handleHex = (hex:string) => {
  let prefixRemoved  = hex.slice(0, 2) === '0x' ? hex.slice(2) : hex;
  return prefixRemoved.length % 2 !== 0 ? `0${prefixRemoved}` : prefixRemoved;
};
