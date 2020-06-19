// import elliptic from 'elliptic'
// import IconService from 'icon-sdk-js'
import { sha3_256 } from 'js-sha3'
import * as scripts from '../scripts'
import CONFIG from '../config'

const elliptic = require('elliptic');
const IconService = require('icon-sdk-js');
const ec = new elliptic.ec('secp256k1')
const { IconBuilder, IconConverter } = IconService

/**
 * Convert public key to address
 * @param {string} compressedPubkey
 * @return {string}
 */
export function pubKeyToAddress(compressedPubkey: string): string {
  let keyPair = ec.keyFromPublic(compressedPubkey, 'hex')
  let publicKey = keyPair.getPublic(false, 'hex').substr(2)
  let bufferPublicKey = Buffer.from(publicKey, 'hex')
  let address = 'hx' + sha3_256(bufferPublicKey).slice(-40)
  return address
}

/**
 *
 * @param {number} addressIndex
 * @param {{from:string, to:string, value:string, time:string, networkId:number}} transaction
 */
export const getScriptAndArguments = (addressIndex: number, transaction: { from: string, to: string, value: string, time: string, networkId: number }) => {
  // 15 32 8000002C 8000004A 80000000 00000000 00000000
  const SEPath = '1532' + '8000002C' + '8000004A' + '80000000' + '00000000' + '00' + addressIndex.toString(16).padStart(6, '0')

  const script = scripts.TRANSFER
  const argument =
    removePrefix(transaction.from) + // e86b015c06145965931aff551d4958256a86226e
    removePrefix(transaction.to) + // 76f46307b53686f2dd4a2c8ca2f22492e842c4bf
    handleHex(transaction.value).padStart(20, '0') + // 00000de0b6b3a7640000
    handleHex(transaction.time).padStart(20, '0') + // 00000005852187bc8800
    handleHex(transaction.networkId.toString(16)).padStart(4, '0') // 0001

  console.log(`sciprt:\t${script}`)
  console.log(`argument:\t ${SEPath}\n+\t${argument}`)
  return {
    script,
    argument: SEPath + argument,
  }
}

/**
 * Get transaction object from payload and encrypted signature
 * @param {{from:string, to:string, value:string, time:string, networkId:number}} transaction
 * @param {{r:string, s:string}} canonicalSignature
 * @param {string} publicKey
 * @returns {object}
 */
export const generateRawTx = async (transaction: { from: string, to: string, value: string, time: string, networkId: number }, canonicalSignature: { r: string, s: string }, publicKey: string) => {
  try {
    let rawTxObj = buildTransactionObj(transaction)
    const phraseToSign = generateHashKey(rawTxObj)
    const signature = generateFullCanonicalSig(canonicalSignature, phraseToSign, publicKey) //signature and recovery
    const b64encoded = Buffer.from(signature, 'hex').toString('base64')
    
    rawTxObj.signature = b64encoded
    return rawTxObj
  } catch (error) {
    throw 'ICX generateRawTx Error: ' + error
  }
}

/**
 * 
 * @param {{from:string, to:string, value:string, time:string, networkId:number}} transaction
 */
const buildTransactionObj = (transaction: { from: string; to: string; value: string; time: string; networkId: number }) => {
  const txObj = new IconBuilder.IcxTransactionBuilder()
    .from(transaction.from)
    .to(transaction.to)
    .value( parseInt(transaction.value, 16) )
    .stepLimit(IconConverter.toBigNumber(CONFIG.STEP_LIMIT))
    .nid(IconConverter.toBigNumber(transaction.networkId)) // network id
    // .nonce(IconConverter.toBigNumber(nonce))
    .version(IconConverter.toBigNumber(CONFIG.VERSION))
    .timestamp(transaction.time)
    .build()

  // Returns raw transaction object
  return IconConverter.toRawTransaction(txObj)
}


/**
 * 
 * @param {{r:string, s: string}} canonicalSignature 
 * @param {string} phraseToSign 
 * @param {string} compressedPubkey 
 * @returns {string}
 */
const generateFullCanonicalSig = (canonicalSignature: { r: string, s: string }, phraseToSign: string, compressedPubkey: string): string => {
  const hashcode = sha3_256.update(phraseToSign).hex()
  const data = Buffer.from(handleHex(hashcode), 'hex')
  return recoverSignature(canonicalSignature, data, compressedPubkey)  
}

/**
 * 
 * @param {{r:string, s:string}} canonicalSignature 
 * @param {Buffer} hash 
 * @param {string} compressedPubkey 
 * @returns {string}
 */
const recoverSignature = (canonicalSignature: { r: string, s: string }, hash: Buffer, compressedPubkey: string): string => {
  const keyPair = ec.keyFromPublic(compressedPubkey, 'hex')
  const recoveryParam = ec.getKeyRecoveryParam(hash, canonicalSignature, keyPair.pub)
  
  const v = recoveryParam === 0 
    ? '00'
    : '01'
  return canonicalSignature.r + canonicalSignature.s + v
}


function generateHashKey(obj: string) {
  let jsonObject
  try {
    jsonObject = JSON.parse(obj)
  } catch (error) {
    jsonObject = obj
  }

  let resultStrReplaced = ''
  let resultStr = objTraverse(jsonObject)
  resultStrReplaced = resultStr.substring(1).slice(0, -1)
  const result = 'icx_sendTransaction.' + resultStrReplaced
  return result
}

function objTraverse(obj: { [x: string]: any }) {
  let result = ''
  result += '{'
  let keys
  keys = Object.keys(obj)
  keys.sort()
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = obj[key]
    switch (true) {
      case value === null: {
        result += `${key}.`
        result += String.raw`\0`
        break
      }
      case typeof value === 'string': {
        result += `${key}.`
        result += escapeString(value)
        break
      }
      case Array.isArray(value): {
        result += `${key}.`
        result += arrTraverse(value)
        break
      }
      case typeof value === 'object': {
        result += `${key}.`
        result += objTraverse(value)
        break
      }
      default:
        break
    }
    result += '.'
  }
  result = result.slice(0, -1)
  result += '}'
  return result
}

function arrTraverse(arr: string | any[]) {
  let result = ''
  result += '['
  for (let j = 0; j < arr.length; j++) {
    const value = arr[j]
    switch (true) {
      case value === null: {
        result += String.raw`\0`
        break
      }
      case typeof value === 'string': {
        result += escapeString(value)
        break
      }
      case Array.isArray(value): {
        result += arrTraverse(value)
        break
      }
      case typeof value === 'object': {
        result += objTraverse(value)
        break
      }
      default:
        break
    }
    result += '.'
  }
  result = result.slice(0, -1)
  result += ']'
  return result
}

function escapeString(value: any) {
  let newString = String.raw`${value}`
  newString = newString.replace('\\', '\\\\')
  newString = newString.replace('.', '\\.')
  newString = newString.replace('{', '\\{')
  newString = newString.replace('}', '\\}')
  newString = newString.replace('[', '\\[')
  newString = newString.replace(']', '\\]')
  return newString
}

export const handleHex = (hex: string) => {
  return evenHexDigit(removeHex0x(hex))
}

/**
 * @description Check if Hex and Even Digit
 * @param {string} hex
 * @return {string}
 */
const evenHexDigit = (hex: string) => {
  return hex.length % 2 !== 0 ? `0${hex}` : hex
}

/**
 * @description Check and Remove Hex Prefix 0x
 */
export const removeHex0x = (hex: string) => {
  return hex.slice(0, 2) === '0x' ? hex.slice(2) : hex
}

export const removePrefix = (hex: string) => {
  return hex.slice(0, 2) === 'hx' ? hex.slice(2) : hex
}
