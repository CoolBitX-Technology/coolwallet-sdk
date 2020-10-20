import { error, transport, apdu } from "@coolwallet/core";
import { handleHex } from "./stringUtil";
import { coinType, Option } from '../type'
import * as token from "../token";
import { Transaction } from '../type';
import { toHex } from '../lib';

import { keccak256, toChecksumAddress } from "../lib";

const rlp = require("rlp");

type Transport = transport.default;

const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ec = new elliptic.ec("secp256k1");

export const getArgument = async (addressIndex: number, getArg: CallableFunction) => {
  const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  const SEPath = `15328000002C800000${coinType}8000000000000000${addressIdxHex}`;
  const argument = await getArg();
  return SEPath + argument
};

/**
 * [toAddress(20B)] [amount(10B)] [gasPrice(10B)] [gasLimit(10B)] [nonce(8B)] [chainId(2B)]
 * @param transaction 
 */
export const getTransferArgument = (transaction: Transaction) => {
  const argument =
    handleHex(transaction.to) + // 81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C
    handleHex(transaction.value).padStart(20, "0") + // 000000b1a2bc2ec50000
    handleHex(transaction.gasPrice).padStart(20, "0") + // 0000000000020c855800
    handleHex(transaction.gasLimit).padStart(20, "0") + // 0000000000000000520c
    handleHex(transaction.nonce).padStart(16, "0") + // 0000000000000289
    handleHex(transaction.chainId.toString(16)).padStart(4, "0"); // 0001
  return argument;
};

/**
 * [toAddress(20B)] [amount(12B)] [gasPrice(10B)] [gasLimit(10B)] [nonce(8B)] [chainId(2B)] [tokenDecimal(1B)] [tokenNameLength(1B)] [tokenName(7B,leftJustified)] [tokenContractAddress(20B)] [tokenSignature(72B)]
 * @param transaction 
 * @param tokenSignature 
 */
export const getERC20Argument = (transaction: Transaction, tokenSignature: string) => {

  const txTokenInfo: Option = transaction.option;
  const tokenInfo = token.getSetTokenPayload(transaction.to, txTokenInfo.info.symbol, parseInt(txTokenInfo.info.decimals));
  const signature = tokenSignature.slice(58).padStart(144, "0");
  const toAddress = transaction.data.slice(10, 74).replace(/\b(0+)/gi, "");;
  const amount = transaction.data.slice(74).replace(/\b(0+)/gi, "");;
  const argument =
    handleHex(toAddress) + // toAddress
    handleHex(amount).padStart(24, "0") + // 000000b1a2bc2ec50000
    handleHex(transaction.gasPrice).padStart(20, "0") + // 0000000000020c855800
    handleHex(transaction.gasLimit).padStart(20, "0") + // 0000000000000000520c
    handleHex(transaction.nonce).padStart(16, "0") + // 0000000000000289
    handleHex(transaction.chainId.toString(16)).padStart(4, "0") + // 0001
    tokenInfo +
    signature;

  console.log("getERC20Argument: " + argument)
  return argument;
};


/**
 * [contractAddress(20B)] [value(10B)] [gasPrice(10B)] [gasLimit(10B)] [nonce(8B)] [chainId(2B)] [contractData(Variety)]
 * @param transaction 
 */
export const getSmartContractArgument = (transaction: Transaction) => {
  const argument =
    handleHex(transaction.to) + // contractAddress : 81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C
    handleHex(transaction.value).padStart(20, "0") + // 000000b1a2bc2ec50000
    handleHex(transaction.gasPrice).padStart(20, "0") + // 0000000000020c855800
    handleHex(transaction.gasLimit).padStart(20, "0") + // 0000000000000000520c
    handleHex(transaction.nonce).padStart(16, "0") + // 0000000000000289
    handleHex(transaction.chainId.toString(16)).padStart(4, "0") + // 0001
    handleHex(transaction.data) // limit of data length : 1208Byte
  return argument;
};


/**
 * [message(Variety)]
 * @param transaction 
 */
export const getSignMessageArgument = (message: string) => {
  const argument =
    handleHex(toHex(message))
  console.log("getSignMessageArgument: " + handleHex(toHex(message)))
  return argument;
};

/**
 * [domainSeparator(32B)] [data(Variety)]
 * @param transaction 
 */
export const getSignTypedDataArgument = (domainSeparator: string, data: string) => {
  const argument =
    handleHex(domainSeparator).padStart(64, "0") + 
    handleHex(data) 
  console.log("getSignTypedDataArgument: " + argument)
  return argument;
};

/**
 * Get raw payload
 * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
 * value:string, data:string, chainId: number}} transaction
 * @return {Array<Buffer>}
 */
export const getRawHex = (transaction: Transaction): Array<Buffer> => {
  const rawData = [];
  rawData.push(transaction.nonce);
  rawData.push(transaction.gasPrice);
  rawData.push(transaction.gasLimit);
  rawData.push(transaction.to); 
  rawData.push(transaction.value);
  rawData.push(transaction.data);
  const raw = rawData.map((d) => {
    const hex = handleHex(d);
    if (hex === "00" || hex === "") {
      return Buffer.allocUnsafe(0);
    }
    return Buffer.from(hex, "hex");
  });
  raw[6] = Buffer.from([transaction.chainId]);
  raw[7] = Buffer.allocUnsafe(0);
  raw[8] = Buffer.allocUnsafe(0);

  console.log(raw)

  const t = rlp.encode(raw);
  if (t.length > 870) throw new error.SDKError(getRawHex.name, 'data too long');
  return raw;
};

/**
 * @description Compose Signed Transaction
 * @param {Array<Buffer>} payload
 * @param {Number} v
 * @param {String} r
 * @param {String} s
 * @param {number} chainId
 * @return {String}
 */
export const composeSignedTransacton = (payload: Array<Buffer>, v: number, r: string, s: string, chainId: number): string => {
  const vValue = v + chainId * 2 + 8;

  const transaction = payload.slice(0, 6);

  transaction.push(
    Buffer.from([vValue]),
    Buffer.from(r, "hex"),
    Buffer.from(s, "hex")
  );

  const serializedTx = rlp.encode(transaction);
  return `0x${serializedTx.toString("hex")}`;
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
  const hash = keccak256(payload);
  const data = Buffer.from(handleHex(hash), "hex");
  const keyPair = ec.keyFromPublic(compressedPubkey, "hex");

  // get v
  const recoveryParam = ec.getKeyRecoveryParam(
    data,
    canonicalSignature,
    keyPair.pub
  );
  const v = recoveryParam + 27;
  const { r } = canonicalSignature;
  const { s } = canonicalSignature;

  return { v, r, s };
};

/**
 * @description APDU Send Raw Data for Segregated Signature
 * @param {Transport} transport
 * @param {Buffer} msgBuf
 * @param {String} p1
 * @return {Function}
 */
// todo : No test case for this function yet, should test later
export const apduForParsignMessage = (
  transport: Transport,
  appPrivateKey: string,
  msgBuf: Buffer,
  p1: string
): Function => {
  let rawData = msgBuf.toString("hex");
  rawData = handleHex(rawData);
  return async () => {
    apdu.tx.txPrep(transport, rawData, p1, appPrivateKey);
  }
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
  const address = trimFirst12Bytes(keccak256(pubkey));
  return toChecksumAddress(address);
}
