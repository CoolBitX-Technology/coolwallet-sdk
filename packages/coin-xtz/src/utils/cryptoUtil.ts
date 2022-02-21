var blake2 = require('blake2b')
import * as params from '../config/params';
import { hexString } from "../config/types";

export function blake2b(data: any, length: number = 32): any {
  var output = new Uint8Array(length);
  const hashHex = blake2(output.length).update(Buffer.from(data, 'hex')).digest('hex');
  console.debug("hashHex: ", hashHex);
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