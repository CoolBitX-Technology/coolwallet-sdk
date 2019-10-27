const rlp = require('rlp')
import Web3 from 'web3'
import elliptic from 'elliptic'
import { core, apdu } from 'sdk-core'
import { keccak256 } from 'js-sha3'
import * as token from './token'

let web3 = new Web3()
const ec = new elliptic.ec('secp256k1')

/**
 * @description Check SE Commands by Raw Payload
 * @param {Transport} transport
 * @param {Array<Buffer>} rawPayload
 * @param {{symbol:string, decimals:number}} erc20Info
 * @return {Promise<{P1: String, P2: String, readType: String, preAction: function}>}
 */
export const checkSECommands = async (transport, rawPayload, erc20Info) => {
  let P1 = '00'
  let P2 = '00'
  if (!Array.isArray(rawPayload)) throw 'Not ethereum transaction format'

  const to = rawPayload[3].toString('hex')
  const data = rawPayload[5].toString('hex')

  // transfer ETH
  if (data === '') return { P1, P2, readType: '3C' }

  if (token.isSupportedERC20Transaction(data) && erc20Info) {
    const preActionPayload = token.getSetTokenPayload(to, erc20Info.symbol, erc20Info.decimals)
    const preAction = token.getSetTokenPreAction(transport, false, preActionPayload)
    return { P1, P2, readType: 'C2', preAction }
  }

  // smart contract
  await core.auth.versionCheck(transport, 84)
  return { P1, P2, readType: '33' }
}

/**
 * @description Compose Signed Transaction
 * @param {Array<Buffer>} payload
 * @param {Number} v
 * @param {String} r
 * @param {String} s
 * @return {String}
 */
export const composeSignedTransacton = (payload, v, r, s) => {
  const chainId = 1
  v += chainId * 2 + 8

  let transaction = payload.slice(0, 6)

  transaction.push(Buffer.from([v]), Buffer.from(r, 'hex'), Buffer.from(s, 'hex'))

  let serialized_tx = rlp.encode(transaction)
  let signedTransaction = `0x${serialized_tx.toString('hex')}`
  return signedTransaction
}

export const handleHex = hex => {
  return evenHexDigit(removeHex0x(hex))
}

/**
 * @description Check if Hex and Even Digit
 * @param {string} hex
 * @return {string}
 */
const evenHexDigit = hex => {
  if (!web3.utils.isHex(hex)) throw `evenHexDigit ${hex} is not hex`
  return hex.length % 2 !== 0 ? `0${hex}` : hex
}

/**
 * @description Check and Remove Hex Prefix 0x
 */
export const removeHex0x = hex => {
  return hex.slice(0, 2) === '0x' ? hex.slice(2) : hex
}

/**
 * @description Generate Canonical Signature from Der Signature
 * @param {{r:string, s:string}} canonicalSignature
 * @param {Buffer} payload
 * @param {String} keyId hex string
 * @param {Boolean} isTesting
 * @return {Promise<{v: Number, r: String, s: String}>}
 */
export const genEthSigFromSESig = async (canonicalSignature, payload, compressedPubkey = undefined, isTesting = false) => {
  try {
    // msg hash
    let data
    if (isTesting) {
      data = payload
    } else {
      const hash = keccak256(payload)
      data = Buffer.from(handleHex(hash), 'hex')
    }

    let keyPair = ec.keyFromPublic(compressedPubkey, 'hex')

    // get v
    let recoveryParam = ec.getKeyRecoveryParam(data, canonicalSignature, keyPair.pub)
    let v = recoveryParam + 27
    let r = canonicalSignature.r
    let s = canonicalSignature.s

    return { v, r, s }
  } catch (error) {
    throw 'ETH generateCanonicalSig : ' + error
  }
}

/**
 * @description APDU Send Raw Data for Segregated Signature
 * @param {Transport} transport
 * @param {Buffer} msgBuf
 * @param {String} p1
 * @return {Function}
 */
export const apduForParsingMessage = (transport, msgBuf, p1) => {
  let rawData = msgBuf.toString('hex')
  rawData = handleHex(rawData)
  let patch = Math.ceil(rawData.length / 500)
  // if (patch > 1) return; // To Do : if card support patch, remove this line
  return async () => {
    for (let i = 0; i < patch; i++) {
      let patchData = rawData.substr(i * 500, 500)
      let p2 = patch === 1 ? '00' : (i === patch - 1 ? '8' : '0') + (i + 1)
      await apdu.tx.prepTx(transport, patchData, p1, p2)
    }
  }
}

/**
 * Convert public key to address
 * @param {string} compressedPubkey
 * @return {string}
 */
export function pubKeyToAddress(compressedPubkey) {
  let keyPair = ec.keyFromPublic(compressedPubkey, 'hex')
  let pubkey = '0x' + keyPair.getPublic(false, 'hex').substr(2)
  let address = trimFirst12Bytes(web3.utils.keccak256(pubkey))
  return web3.utils.toChecksumAddress(address)
}

/**
 * @description Trim Hex for Address
 * @param {string} hexString expect 32 bytes address in topics
 * @return {string} 20 bytes address + "0x" prefixed
 */
function trimFirst12Bytes(hexString) {
  return '0x'.concat(hexString.substr(hexString.length - 40))
}
