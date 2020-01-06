/* eslint-disable no-bitwise */
import crc from 'crc';

const base32 = require('base32.js');

type versionByteNames = import('./types').versionByteNames;

const versionBytes = {
  ed25519PublicKey: 6 << 3, // G
  ed25519SecretSeed: 18 << 3, // S
  preAuthTx: 19 << 3, // T
  sha256Hash: 23 << 3 // X
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
