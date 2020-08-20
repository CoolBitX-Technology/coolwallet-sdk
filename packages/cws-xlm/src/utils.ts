/* eslint-disable no-bitwise */
import crc from 'crc';
import * as scripts from "./scripts";

const base32 = require('base32.js');

type versionByteNames = import('./types').versionByteNames;

const versionBytes = {
  ed25519PublicKey: 6 << 3, // G
  ed25519SecretSeed: 18 << 3, // S
  preAuthTx: 19 << 3, // T
  sha256Hash: 23 << 3 // X
};


/**
 * TODO
 * @param {number} addressIndex
 * @param {*} transaction
 */
export const getScriptAndArguments = (apppublicKeys: { from: string, to: string }, addressIndex: number, transaction: object, coinType: string) => {
  console.log("getScriptAndArguments start")
  const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  const SEPath = `0D108000002C8000009480000000`;
  let script;
  let argument;
  script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
  argument = getTransferArgument(transaction, apppublicKeys);

  return {
    script,
    argument: SEPath + argument,
  };
};

const getTransferArgument = (transaction: any, apppublicKeys: { from: string, to: string }) => {
  console.log("getTransferArgument start +++++")
  const tx = transaction
  console.log(handleHex(apppublicKeys.from))
  console.log(handleHex(apppublicKeys.from)) // undefined
  console.log(handleHex(parseInt(parseInt(tx.operations[0].amount).toString().padEnd(8, "0")).toString(16)).padStart(16, "0")) // undefined

  console.log(handleHex(parseInt(tx.fee).toString(16)).padStart(16, "0"))
  console.log(handleHex(parseInt(tx.sequence).toString(16)).padStart(16, "0"))
  console.log(handleHex(tx.timeBounds.minTime).padStart(16, "0"))
  console.log(handleHex(tx.timeBounds.maxTime).padStart(16, "0"))
  console.log(handleHex("00").padStart(2, "0")) // undefined
  console.log(handleHex("00").padStart(64, "0"))
  console.log(handleHex("00").padStart(2, "0")) // undefined
  const argument =
    handleHex(apppublicKeys.from) +
    handleHex(apppublicKeys.to) + // TODO
    handleHex(parseInt(parseInt(tx.operations[0].amount).toString().padEnd(8, "0")).toString(16)).padStart(16, "0") +
    handleHex(parseInt(tx.fee).toString(16)).padStart(16, "0") +
    handleHex(parseInt(tx.sequence).toString(16)).padStart(16, "0") +
    handleHex(tx.timeBounds.minTime).padStart(16, "0") +
    handleHex(tx.timeBounds.maxTime).padStart(16, "0") +
    handleHex("00").padStart(2, "0") + //memoType // TODO
    handleHex("00").padStart(64, "0") + //memo
    handleHex("00").padStart(2, "0");  //isCreate// TODO
  return argument;
};

function calculateChecksum(payload: Buffer) {
  // This code calculates CRC16-XModem checksum of payload
  // and returns it as Buffer in little-endian order.
  const checksum = Buffer.allocUnsafe(2);
  checksum.writeUInt16LE(crc.crc16xmodem(payload), 0);
  return checksum;
}

export function encodeCheck(versionByteName: versionByteNames, data: Buffer) {
  const versionByte = versionBytes[versionByteName];

  const versionBuffer = Buffer.from([versionByte]);
  const payload = Buffer.concat([versionBuffer, data]);
  const checksum = calculateChecksum(payload);
  const unencoded = Buffer.concat([payload, checksum]);

  return base32.encode(unencoded);
}

export function encodeEd25519PublicKey(data: Buffer) {
  return encodeCheck('ed25519PublicKey', data);
}

export function pubKeyToAddress(publicKey: string): string {
  const pubKey = publicKey.length === 66 ? publicKey.slice(2) : publicKey;
  console.log("pubKey: " + pubKey)
  const pubKeyBuf = Buffer.from(pubKey, 'hex');
  return encodeEd25519PublicKey(pubKeyBuf);
}

export const handleHex = (hex: string) => {
  const prefixRemoved = hex.slice(0, 2) === '0x' ? hex.slice(2) : hex;
  return prefixRemoved.length % 2 !== 0 ? `0${prefixRemoved}` : prefixRemoved;
};
