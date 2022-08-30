/* eslint-disable @typescript-eslint/no-var-requires */
import BigNumber from 'bignumber.js';
import type { Integer } from '../config/types';

const base32 = require('base32.js');

function toVarint(num: Integer) {
  let bin = BigNumber(num).toString(2);
  const bytes = [];
  while (bin.length > 0) {
    let out = parseInt(bin.slice(-7), 2);
    bin = bin.slice(0, -7);
    if (bin.length > 0) out += 128;
    bytes.push(out);
  }
  return Buffer.from(new Uint8Array(bytes)).toString('hex');
}

function getAddrPayloadArgsById(id: string) {
  const varint = toVarint(id);
  const idHex = BigNumber(id).toString(16).padStart(96, '0');
  const emptyChecksum = '00000000';
  const payloadType = '00';
  return { payload: varint, args: payloadType + idHex + emptyChecksum };
}

function getAddrPayloadArgsByBase32Str(base32Str: string) {
  const decoder = new base32.Decoder();
  const payloadAndChecksum = Buffer.from(decoder.write(base32Str).finalize()).toString('hex');
  const payload = payloadAndChecksum.slice(0, -8);
  const payloadLength = Math.ceil(payload.length/2);
  let payloadType;
  switch (payloadLength) {
    case 20: {
      payloadType = '01';
      break;
    }
    case 32: {
      payloadType = '02';
      break;
    }
    case 48: {
      payloadType = '03';
      break;
    }
    default: throw new Error(`unsupported payload length: ${payloadLength}`);
  }
  return { payload, args: payloadType + payloadAndChecksum.padStart(104, '0') };
}

function getAddrCborItems(address: string) {
  if (!/[fT]/.test(address[0]))
    throw new Error('unsupport address format');

  if (!/\d/.test(address[1]))
    throw new Error('unsupport address format');

  const protocol = address[1].padStart(2, '0');
  const data = address.substr(2);

  if (protocol === '00' && !/^\d+$/.test(data))
    throw new Error('class 0 should be a decimal string');

  if (protocol !== '00' && !/^[abcdefghijklmnopqrstuvwxyz234567]+$/.test(data))
    throw new Error('actor address should be a base32 string');

  const { payload, args } = (protocol === '00') ?
    getAddrPayloadArgsById(data) :
    getAddrPayloadArgsByBase32Str(data);

  const length = Math.ceil(payload.length/2) + 1; // +1 for protocol byte
  const { prefix, argument: prefixArg } = getCborPrefix(length, 64);

  return { prefix, prefixArg, protocol, payload, args };
}

function getAddrArgs(address: string) {
  const { prefix, prefixArg, protocol, args } = getAddrCborItems(address); 
  return prefix + prefixArg.padStart(2,'0') + protocol + args;
}

function getAddrField(address: string) {
  const { prefix, prefixArg, protocol, payload } = getAddrCborItems(address); 
  return prefix + prefixArg + protocol + payload;
}

function getCborPrefix(num: Integer, type=0) {
  const bn = BigNumber(num);
  if (bn.isLessThanOrEqualTo(BigNumber(23)))
    return { prefix: bn.plus(BigNumber(type)).toString(16).padStart(2, '0'), argument: '' };

  let prefix;
  let length;
  if (bn.isLessThanOrEqualTo(BigNumber('ff', 16))) {
    prefix = (type+24).toString(16);
    length = 1;
  } else if (bn.isLessThanOrEqualTo(BigNumber('ffff', 16))) {
    prefix = (type+25).toString(16);
    length = 2;
  } else if (bn.isLessThanOrEqualTo(BigNumber('ffffffff', 16))) {
    prefix = (type+26).toString(16);
    length = 4;
  } else if (bn.isLessThanOrEqualTo(BigNumber('ffffffffffffffff', 16))) {
    prefix = (type+27).toString(16);
    length = 8;
  } else {
    throw new Error('uint exceeds the allowable value');
  }
  const argument = bn.toString(16).padStart(length*2, '0');
  return { prefix, argument };
}

function getUintArgs(num: Integer) {
  const { prefix, argument } = getCborPrefix(num);
  const argumentLength = '0' + (argument.length/2).toString();
  return prefix + argumentLength + argument.padEnd(16, '0'); // 8 bytes for argument buffer
}

function getUintField(num: Integer) {
  const { prefix, argument } = getCborPrefix(num);
  return prefix + argument;
}

function getBigNumberCborItems(num: Integer) {
  const bn = BigNumber(num);
  if (bn.isGreaterThan(BigNumber('ffffffffffffffffffffffffffffffff', 16)))
    throw new Error('value exceeds allowance');

  let hex = bn.toString(16);
  hex = (hex.length%2 !== 0 ? '0' : '') + '00' + hex;
  const length = hex.length/2;

  const { prefix, argument: prefixArg } = getCborPrefix(length, 64);
  return { prefix, prefixArg, length, hex };
}

function getBigNumberArgs(num: Integer) {
  const { prefix, prefixArg, length, hex } = getBigNumberCborItems(num);
  const lengthHex = length.toString(16).padStart(2, '0');
  return prefix + prefixArg.padStart(2, '0') + lengthHex + hex.padEnd(32, '0'); // 16 bytes for argument buffer
}

function getBigNumberField(num: Integer) {
  const { prefix, prefixArg, hex } = getBigNumberCborItems(num);
  return prefix + prefixArg + hex;
}

function getSmartArgs(method: number, params: string) {
  const methodArgs = method.toString(16).padStart(2, '0');

  const base64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  if (!base64.test(params)) throw new Error('params should be a base64 string');

  let paramsArgs = Buffer.from(params, 'base64').toString('hex');
  paramsArgs = (paramsArgs.length%2 ? '0' : '') + paramsArgs;

  const { prefix, argument } = getCborPrefix(paramsArgs.length/2, 64);
  paramsArgs = prefix + argument + paramsArgs;

  console.log('\nmethodArgs :', methodArgs);
  console.log('paramsArgs :', paramsArgs);

  return methodArgs + paramsArgs;
}

export { getCborPrefix, getAddrField, getUintField, getBigNumberField, getAddrArgs, getUintArgs, getBigNumberArgs, getSmartArgs };
