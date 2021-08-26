import * as stringUtil from "./stringUtil";
import { assert, bnToU8a, u8aConcat } from '@polkadot/util';
import BN from 'bn.js';
import * as types from '../config/types';
import * as params from '../config/params';
import { SDKError } from "@coolwallet/core/lib/error";


// eslint-disable-next-line new-cap
const { decodeAddress } = require('@polkadot/keyring');

const MAX_U8 = new BN(2).pow(new BN(8 - 2)).subn(1);
const MAX_U16 = new BN(2).pow(new BN(16 - 2)).subn(1);
const MAX_U32 = new BN(2).pow(new BN(32 - 2)).subn(1);

const BIT_SIGNED = 128;
const BIT_UNSIGNED = 0;

export function getFormatTxData(rawData: types.dotTransaction): types.FormatTransfer {

  const mortalEra = getMortalEra(rawData.blockNumber, rawData.era)
  const nonce = parseInt(rawData.nonce).toString(16)
  const encodeNonce = formatSCALECodec(rawData.nonce)
  const tip = parseInt(rawData.tip).toString(16)
  const encodeTip = formatSCALECodec(rawData.tip)
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

export function getNormalMethod(methodCallIndex: types.Method, rawData: types.NormalMethod): { method: types.FormatNormalMethod, methodString: string } {
  const callIndex = methodCallIndex.transfer
  const destAddress = Buffer.from(decodeAddress(rawData.destAddress)).toString('hex')
  const value = stringUtil.paddingString(new BN(rawData.value).toString(16))

  return {
    method: {
      callIndex,
      destAddress,
      value
    },
    methodString: callIndex + params.TX_ADDRESS_PRE + destAddress + formatSCALECodec(rawData.value)
  }
}

export function getBondMethod(methodCallIndex: types.Method, rawData: types.BondMethod): { method: types.FormatBondMethod, methodString: string } {
  const callIndex = methodCallIndex.bond
  const controllerAddress = Buffer.from(decodeAddress(rawData.controllerAddress)).toString('hex')
  const value = stringUtil.paddingString(new BN(rawData.value).toString(16))
  const payeeType = rawData.payee


  return {
    method: {
      callIndex,
      controllerAddress,
      value,
      payeeType
    },
    methodString: callIndex + params.TX_ADDRESS_PRE + controllerAddress + formatSCALECodec(rawData.value) + payeeType
  }
}

export function getBondExtraMethod(methodCallIndex: types.Method, rawData: types.BondExtraMethod): { method: types.FormatBondExtraMethod, methodString: string } {
  const callIndex = methodCallIndex.bondExtra
  const maxAdditional = stringUtil.paddingString(new BN(rawData.maxAdditional).toString(16))

  return {
    method: {
      callIndex,
      maxAdditional
    },
    methodString: callIndex + formatSCALECodec(rawData.maxAdditional)
  }
}

export function getUnbondMethod(methodCallIndex: types.Method, rawData: types.UnbondMethod): { method: types.FormatUnbondMethod, methodString: string } {
  const callIndex = methodCallIndex.unbond
  const value = stringUtil.paddingString(new BN(rawData.value).toString(16))

  return {
    method: {
      callIndex,
      value
    },
    methodString: callIndex + formatSCALECodec(rawData.value)
  }
}

// TODO
export function getNominateMethod(methodCallIndex: types.Method, rawData: types.NominateMethod): { method: types.FormatNominateMethod, methodString: string } {
  const callIndex = methodCallIndex.nominate
  const addressCount = rawData.targetAddresses.length.toString(16)
  const shiftTargetCount = formatSCALECodec(rawData.targetAddresses.length.toString())
  let targetsString = ''
  rawData.targetAddresses.forEach(target => {
    targetsString += params.TX_ADDRESS_PRE + Buffer.from(decodeAddress(target, 0)).toString('hex')
  });

  return {
    method: {
      callIndex,
      addressCount,
      targetsString
    },
    methodString: callIndex + shiftTargetCount + targetsString
  }
}

export function getWithdrawUnbondedMethod(methodCallIndex: types.Method, rawData: types.WithdrawUnbondedMethod): { method: types.FormatWithdrawUnbondedTxMethod, methodString: string } {
  const callIndex = methodCallIndex.withdraw
  const numSlashingSpans = new BN(rawData.numSlashingSpans).toString(16)

  const formatNumSlashingSpans = stringUtil.reverse(stringUtil.paddingString(numSlashingSpans)).padEnd(8, '0')

  return {
    method: {
      callIndex,
      numSlashingSpans
    },
    methodString: callIndex + formatNumSlashingSpans
  }
}

export function getChillMethod(methodCallIndex: types.Method): string {
  return methodCallIndex.chill;
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
  const binaryValue = parseInt(blockNumber).toString(2);
  const power = Math.ceil(Math.log2(parseInt(era)));

  let binaryPower = (power - 1).toString(2);
  binaryPower = stringUtil.paddingString(binaryPower);

  let result = binaryValue.substr(binaryValue.length - power) + binaryPower;

  result = parseInt(result, 2).toString(16);
  result = stringUtil.paddingString(result).padStart(4, '0');

  const mortalEra = stringUtil.reverse(result);

  return mortalEra;
}

export function formatSCALECodec(value: string): string {

  const bigValue = new BN(value)
  console.debug('bigValue: ', bigValue.shln(2))

  let formatValue
  const mode = getValueMode(value)
  console.debug("mode: ", mode)
  switch (mode) {
    case params.ValueMode.singleByteMode:
      formatValue = (bigValue.shln(2)).or(new BN('0'))
      break;
    case params.ValueMode.twoByteMode:
      formatValue = (bigValue.shln(2)).or(new BN('1'))
      break;
    case params.ValueMode.foreByteMode:
      formatValue = (bigValue.shln(2)).or(new BN('2'))
      break;
    case params.ValueMode.bigIntegerMode:
      const length = Math.ceil(bigValue.toString(16).length / 2)
      const addCode = (length - 4).toString(2).padStart(6, '0') + '11'

      formatValue = (bigValue.shln(8)).add(new BN(addCode, 2))
      break;
    default:
      throw new SDKError(formatSCALECodec.name, "input value should be less than 2 ** 536 - 1")
  }

  let result = stringUtil.paddingString(formatValue.toString(16))
  const output = stringUtil.reverse(result)
  if (mode == params.ValueMode.foreByteMode) {
    return output.padEnd(8, '0')
  }

  return output
}

/**
 * 
- `0b00`: single-byte mode; upper six bits are the LE encoding of the value (valid only for values of 0-63).
- `0b01`: two-byte mode: upper six bits and the following byte is the LE encoding of the value (valid only for values `64-(2**14-1)`).
- `0b10`: four-byte mode: upper six bits and the following three bytes are the LE encoding of the value (valid only for values `(2**14)-(2**30-1)`).
- `0b11`: Big-integer mode: The upper six bits are the number of bytes following, less four. The value is contained, LE encoded, in the bytes following. The final (most significant) byte must be non-zero. Valid only for values `(2**30)-(2**536-1)`.
 * @param value 
 * @returns 
 */
export function getValueMode(value: string): string {

  let mode;
  const one = new BN(1)
  const bigValue = new BN(value)
  if (bigValue.cmp(new BN(64)) == -1) {
    mode = params.ValueMode.singleByteMode
  } else if (bigValue.cmp(new BN(64)) >= 0 && bigValue.cmp(new BN(2 ** 14)) == -1) {
    mode = params.ValueMode.twoByteMode
  } else if (bigValue.cmp(new BN(2 ** 14)) >= 0 && bigValue.cmp(new BN(2 ** 30)) == -1) {
    mode = params.ValueMode.foreByteMode
  } else { // (2**30)-(2**536-1).
    mode = params.ValueMode.bigIntegerMode
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
  // console.debug("signedTx: ", signedTx)
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
export function getSignedTxLength(_value: BN | number): Uint8Array {
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

