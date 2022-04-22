/* eslint-disable @typescript-eslint/no-var-requires */
const blake2 = require('blake2b');
import * as params from '../config/params';
import { hexString } from "../config/types";

export function blake2b(data: any, length = 32): string {
  const hashHex = blake2(length).update(Buffer.from(data, 'hex')).digest('hex');
  return hashHex;
}

export function getXtzPath(pathType: string, addressIndex: number): hexString {
  const path: hexString = pathType +
    '8000002C' +
    params.COIN_TYPE +
    (Math.floor(addressIndex) + 0x80000000).toString(16) +
    '80000000';
  return path;  
}
