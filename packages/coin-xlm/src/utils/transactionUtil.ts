/* eslint-disable no-bitwise */
import crc from 'crc';
import * as types from '../config/types';
import * as params from '../config/params';

const base32 = require('base32.js');

function calculateChecksum(payload: Buffer) {
  // This code calculates CRC16-XModem checksum of payload
  // and returns it as Buffer in little-endian order.
  const checksum = Buffer.allocUnsafe(2);
  checksum.writeUInt16LE(crc.crc16xmodem(payload), 0);
  return checksum;
}

export function encodeCheck(versionByteName: types.versionByteNames, data: Buffer) {
  const versionByte = params.VERSION_BYTES[versionByteName];

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
