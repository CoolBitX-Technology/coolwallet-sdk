import { error, transport, apdu } from "@coolwallet/core";
import * as stringUtil from "./stringUtil";
import { assert, bnToU8a, u8aConcat, u8aToBn } from '@polkadot/util';
import BN from 'bn.js';
import { sha256 } from './cryptoUtil';
import * as types from '../config/types';
import * as params from '../config/params';
import { SDKError } from "@coolwallet/core/lib/error";


// type Transport = transport.default;

const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ec = new elliptic.ec("secp256k1");
const { encodeAddress, decodeAddress } = require('@polkadot/keyring');

const MAX_U8 = new BN(2).pow(new BN(8 - 2)).subn(1);
const MAX_U16 = new BN(2).pow(new BN(16 - 2)).subn(1);
const MAX_U32 = new BN(2).pow(new BN(32 - 2)).subn(1);

const BIT_SIGNED = 128;
const BIT_UNSIGNED = 0;

export function getFormatTxData(rawData: types.dotTransaction): types.FormatTransfer {

  const mortalEra = getMortalEra(rawData.blockNumber, rawData.era)
  const nonce = parseInt(rawData.nonce).toString(16)
  const encodeNonce = formatValue(rawData.nonce)
  const tip = parseInt(rawData.tip).toString(16)
  const encodeTip = formatValue(rawData.tip)
  const specVer = formatVersion(rawData.specVersion)
  const txVer = formatVersion(rawData.transactionVersion)
  const genesisHash = rawData.genesisHash
  const blockHash = rawData.blockHash

  return {
    mortalEra,
    nonce,
    encodeNonce,
    tip,
    encodeTip,
    specVer,
    txVer,
    blockHash,
    genesisHash
  }

}

export function getNormalMethod(rawData: types.NormalMethod): { method: types.FormatNormalMethod, methodString: string } {
  const callIndex = params.Method.transfer
  const destAddress = Buffer.from(decodeAddress(rawData.destAddress)).toString('hex')
  const value = stringUtil.paddingString(BigInt(rawData.value).toString(16))

  return {
    method: {
      callIndex,
      destAddress,
      value
    },
    methodString: callIndex + '00' + destAddress + formatValue(rawData.value)
  }
}

export function getBondMethod(rawData: types.BondMethod): { method: types.FormatBondMethod, methodString: string } {
  const callIndex = params.Method.bond
  const controllerAddress = Buffer.from(decodeAddress(rawData.controllerAddress)).toString('hex')
  const value = formatValue(rawData.value)

  return {
    method: {
      callIndex,
      controllerAddress,
      value
    },
    methodString: callIndex + '00' + controllerAddress + value
  }
}

export function getUnbondMethod(rawData: types.UnbondMethod): { method: types.FormatUnbondMethod, methodString: string } {
  const callIndex = params.Method.unbond
  const value = formatValue(rawData.value)

  return {
    method: {
      callIndex,
      value
    },
    methodString: callIndex + value
  }
}

// TODO
export function getNominateMethod(rawData: types.NominateMethod): { method: types.FormatNominateMethod, methodString: string } {
  const callIndex = params.Method.nominate
  const addressCount = '04'
  const targetAddress = formatValue(rawData.targetAddress)

  return {
    method: {
      callIndex,
      addressCount,
      targetAddress
    },
    methodString: callIndex + addressCount + '00' + targetAddress
  }
}

// TODO
export function getWithdrawUnbondedMethod(rawData: types.WithdrawUnbondedMethod): { method: types.FormatWithdrawUnbondedTxMethod, methodString: string } {
  const callIndex = params.Method.withdraw
  const numSlashingSpans = formatValue(rawData.numSlashingSpans)

  return {
    method: {
      callIndex,
      numSlashingSpans
    },
    methodString: callIndex + numSlashingSpans
  }
}

export function getMethodLength(methodString: string): string {
  const len = methodString.length
  let lenStr = ''
  if (len < 128) {
    lenStr = len.toString(2) + '0'
  } else {
    lenStr = len.toString(2) + '1'
  }
  lenStr = parseInt(lenStr, 2).toString(16)
  lenStr = stringUtil.paddingString(lenStr)
  lenStr = stringUtil.reverse(stringUtil.paddingString(lenStr))

  return lenStr

}

export function getMortalEra(blockNumber: string, era: string): string {
  const binaryValue = parseInt(blockNumber).toString(2)
  const power = Math.ceil(Math.log2(parseInt(era)))

  let binaryPower = (power - 1).toString(2)
  binaryPower = stringUtil.paddingString(binaryPower)

  let result = binaryValue.substr(binaryValue.length - power) + binaryPower

  result = parseInt(result, 2).toString(16)
  result = stringUtil.paddingString(result)

  const mortalEra = stringUtil.reverse(result)

  return mortalEra
}


export function formatValue(value: string): string {

  const bigValue = BigInt(value)
  let binaryValue = bigValue.toString(2)
  const mode = getValueMode(value)
  switch (mode){
    case params.ValueMode.singleByteMode:
      binaryValue += '00'
      break;
    case params.ValueMode.twoByteMode:
      binaryValue += '01'
      break;
    case params.ValueMode.foreByteMode:
      binaryValue += '10'
      break;
    case params.ValueMode.bigIntegerMode:
      const length = Math.ceil(bigValue.toString(16).length / 2)
      const addCode = (length - 4).toString(2).padStart(6, '0') + '11'
      binaryValue = binaryValue + addCode
      break;
    default:
      throw new SDKError(formatValue.name, "input value should be less than 2 ** 536 - 1")
  }

  let result = BigInt('0b' + binaryValue).toString(16)
  result = stringUtil.paddingString(result)
  const output = stringUtil.reverse(result)

  if (mode == params.ValueMode.foreByteMode) {
    return  output.padEnd(8, '0')
  }

  return output
}

export function getValueMode(value: string): string {
  let mode;
  const bigValue = BigInt(value)
  if (bigValue < 64) {
    mode = params.ValueMode.singleByteMode
  } else if (64 < bigValue && bigValue < (2 ** 14 - 1)) {
    mode = params.ValueMode.twoByteMode
  } else if ((2 ** 14) < bigValue && bigValue < (2 ** 30 - 1)) {
    mode = params.ValueMode.foreByteMode
  } else if ((2 ** 30) < bigValue && bigValue < (2 ** 536 - 1)) {
    mode = params.ValueMode.bigIntegerMode
  } else {
    throw new SDKError(formatValue.name, "input value should be less than 2 ** 536 - 1")
  }
  return mode;
}


export function formatVersion(value: string): string {
  let hexValue = parseInt(value).toString(16)
  hexValue = stringUtil.paddingString(hexValue)
  return stringUtil.reverse(hexValue).padEnd(8, '0')
}



export function addVersion(signedTx: string, version: number, isSigned: boolean = true): string {
  const resultVer = version | (isSigned ? BIT_SIGNED : BIT_UNSIGNED)
  return resultVer.toString(16) + signedTx
}

/**
 * 
 * @param signedTx (hex string): [version][from address][signature][MortalEra][nonce][tip][method]
 * @returns 
 */
export function addSignedTxLength(signedTx: string): string {
  console.log("signedTx:")

  const signedTxU8a = Uint8Array.from(Buffer.from(signedTx, 'hex'));
  const _value = signedTxU8a.length
  const result = u8aConcat(getSignedTxLength(_value), signedTxU8a)
  return Buffer.from(result).toString('hex')
}



/**
 * 
 * @param _value signed transaction length
 * @returns 
 */
export function getSignedTxLength(_value: BN | BigInt | number): Uint8Array {
  const value = stringUtil.bnToBn(_value);

  if (value.lte(MAX_U8)) {
    return new Uint8Array([value.toNumber() << 2]);
  } else if (value.lte(MAX_U16)) {
    return bnToU8a(value.shln(2).addn(0b01), 16, true);
  } else if (value.lte(MAX_U32)) {
    return bnToU8a(value.shln(2).addn(0b10), 32, true);
  }

  const u8a = bnToU8a(value);
  let length = u8a.length;

  // adjust to the minimum number of bytes
  while (u8a[length - 1] === 0) {
    length--;
  }

  assert(length >= 4, 'Previous tests match anyting less than 2^30; qed');

  return u8aConcat(
    new Uint8Array([
      // substract 4 as minimum (also catered for in decoding)
      ((length - 4) << 2) + 0b11
    ]),
    u8a.subarray(0, length)
  );
}

