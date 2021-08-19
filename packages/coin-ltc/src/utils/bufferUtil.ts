import BN from 'bn.js';
import { transport, error, tx, apdu } from '@coolwallet/core';
import * as varuint from './varuint';
import * as stringUtil from './stringUtil';
import * as cryptoUtil from './cryptoUtil';
import * as params from "../config/params";
import * as bitcoin from 'bitcoinjs-lib';
import * as types from '../config/types';
type Transport = transport.default;
const litecore = require("litecore-lib");
const base58 = require("bs58");

export function toVarUintBuffer(int: number): Buffer {
  return varuint.encode(int);
}

export function toUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
  const bn = new BN(numberOrString);
  const buf = Buffer.from(bn.toArray()).reverse();
  return Buffer.alloc(byteSize).fill(buf, 0, buf.length);
}

export function toNonReverseUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
  const bn = new BN(numberOrString);
  const buf = Buffer.from(bn.toArray());
  return Buffer.alloc(byteSize).fill(buf, byteSize - buf.length, byteSize);
}


