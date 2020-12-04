/* eslint-disable no-bitwise */
import crc from 'crc';
import BigNumber from 'bignumber.js';
import * as scripts from "./scripts";
import * as Stellar from 'stellar-sdk';
import { path_bip44, path_slip0010, PROTOCOL } from './types';

const BN = require('bn.js');
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
export const getScriptAndArguments = (transaction: object, transfer: { script: string, signature: string }, protocol: PROTOCOL) => {

  const path = protocol === PROTOCOL.BIP44 ? path_bip44 : path_slip0010;

  const SEPath = `0D${path}`;
  let script;
  let argument;
  script = transfer.script + transfer.signature;
  argument = getTransferArgument(transaction);

  return {
    script,
    argument: SEPath + argument,
  };
};

const getTransferArgument = (transaction: any) => {

  const isCreate = transaction.isCreate ? "00" : "01";
  let memoType;
  let memo = transaction.memo;
  switch (transaction.memoType) {
    case Stellar.MemoHash:
      memoType = "03"
      break;
    case Stellar.MemoReturn:
      memoType = "04"
      break;
    case Stellar.MemoText:
      memoType = "01"
      memo = Buffer.from(memo, 'ascii').toString('hex')
      break;
    case Stellar.MemoID:
      memoType = "02"
      memo = parseInt(memo).toString(16)
      break;
    case Stellar.MemoNone:
    default:
      memoType = "00"
      break;
  }

  const minTime = transaction.minTime ? transaction.minTime : "0"
  const maxTime = transaction.maxTime ? transaction.maxTime : "0"

  const argument =
    transaction.from +
    transaction.to +
    parseInt(transaction.amount).toString(16).padStart(16, "0") +
    parseInt(transaction.fee).toString(16).padStart(16, "0") +
    new BigNumber(transaction.sequence).toString(16).padStart(16, "0") +
    parseInt(minTime).toString(16).padStart(16, "0") +
    parseInt(maxTime).toString(16).padStart(16, "0") +
    memoType.padStart(2, "0") + //memoType 
    memo.padStart(64, "0") + //memo
    isCreate.padStart(2, "0");  //isCreate 

  console.log("argument:" + argument)
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

  const pubKeyBuf = Buffer.from(pubKey, 'hex');
  return encodeEd25519PublicKey(pubKeyBuf);
}

export const handleHex = (hex: string) => {
  const prefixRemoved = hex.slice(0, 2) === '0x' ? hex.slice(2) : hex;
  return prefixRemoved.length % 2 !== 0 ? `0${prefixRemoved}` : prefixRemoved;
};
