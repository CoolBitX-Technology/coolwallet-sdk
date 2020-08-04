import crypto from 'crypto';
import bech32 from 'bech32';
import * as scripts from "./scripts";
import { coinType } from './types'

export function publicKeyToAddress(publicKey: string) {
  const hash = sha256ripemd160(publicKey);
  return encodeAddress(hash);
}

function encodeAddress(value: Buffer, prefix = 'bnb') {
  const words = bech32.toWords(value);
  return bech32.encode(prefix, words);
}

function sha256ripemd160(publicKey: string): Buffer {
  const hash = crypto.createHash('SHA256').update(Buffer.from(publicKey, 'hex')).digest();
  return crypto.createHash('ripemd160').update(hash).digest();
}

function sortObject(obj: any): any {
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) return obj.map(sortObject);
  const sortedKeys = Object.keys(obj).sort();
  const result = {};
  sortedKeys.forEach((key) => {
    (result as any)[key] = sortObject(obj[key]);
  });
  return result;
}

export const convertObjectToSignBytes = (obj: any) => Buffer.from(JSON.stringify(sortObject(obj)));

export function combineSignature(canonicalSignature: any): string {
  return canonicalSignature.r + canonicalSignature.s;
}

const getTransferArgument = (transaction: any) => {
  const argument = ''
  /*handleHex(transaction.to) + // 81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C
  handleHex(transaction.value).padStart(20, "0") + // 000000b1a2bc2ec50000
  handleHex(transaction.gasPrice).padStart(20, "0") + // 0000000000020c855800
  handleHex(transaction.gasLimit).padStart(20, "0") + // 0000000000000000520c
  handleHex(transaction.nonce).padStart(16, "0") + // 0000000000000289
  handleHex(transaction.chainId.toString(16)).padStart(4, "0"); // 0001
  */
  return argument;
};

const getERC20Argument = (transaction: any) => {
  /*const data = handleHex(transaction.data.toString("hex"));
  const { to, amount } = token.parseToAndAmount(data);
  const { symbol, decimals } = transaction.tokenInfo;
  const tokenInfo = token.getSetTokenPayload(transaction.to, symbol, decimals);
  const signature = "00".repeat(72);
  */
  const argument = ''
  /*handleHex(to) +
  handleHex(amount).padStart(24, "0") + // 000000b1a2bc2ec50000
  handleHex(transaction.gasPrice).padStart(20, "0") + // 0000000000020c855800
  handleHex(transaction.gasLimit).padStart(20, "0") + // 0000000000000000520c
  handleHex(transaction.nonce).padStart(16, "0") + // 0000000000000289
  handleHex(transaction.chainId.toString(16)).padStart(4, "0") + // 0001
  tokenInfo +
  signature;*/
  return argument;
};

export const getScriptAndArguments = (txType: any, addressIndex: number, transaction: any) => {
  const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  const SEPath = `15328000002C800000${coinType}8000000000000000${addressIdxHex}`;
  let script;
  let argument;

  script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
  argument = getTransferArgument(transaction);

  return {
    script,
    argument: SEPath + argument,
  };
}