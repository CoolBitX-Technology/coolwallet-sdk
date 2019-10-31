const rlp = require('rlp')
import { core } from 'sdk-core'
import * as ethUtil from './eth_utils'
import Web3 from 'web3'
import { TypedDataUtils as typedDataUtils } from 'eth-sig-util'
let web3 = new Web3()

/**
 * sign ETH Transaction
 * @param {Transport} transport
 * @param {String} appPrivateKey
 * @param {coinType} coinType
 * @param {String} payload
 * @param {Number} addressIndex
 * @param {String} publicKey
 */
export const signTransaction = async (transport, appPrivateKey, coinType, payload, addressIndex, publicKey) => {
  const keyId = core.util.addressIndexToKeyId(coinType, addressIndex)
  payload = Buffer.from(payload, 'hex')
  const rawPayload = rlp.decode(payload)
  const { P1, P2, readType, preAction } = await ethUtil.checkSECommands(transport, rawPayload)
  const dataForSE = core.flow.prepareSEData(keyId, rawPayload, readType)
  const { signature: canonicalSignature, cancel } = await core.flow.sendDataToCoolWallet(
    transport,
    appPrivateKey,
    dataForSE,
    P1,
    P2,
    false,
    preAction
  )
  if (cancel) throw 'User canceled.'

  const { v, r, s } = await ethUtil.genEthSigFromSESig(canonicalSignature, payload, publicKey)
  const serialized_tx = ethUtil.composeSignedTransacton(rawPayload, v, r, s)
  return serialized_tx
}

/**
 * Sign Message.
 * @param {Transport} transport
 * @param {String} appPrivateKey
 * @param {String} message hex or utf-8
 * @param {Number} addressIndex
 * @param {String} publicKey
 * @param {Boolean} isHashRequired used by joyso
 * @return {Promise<String>}
 */
export const signMessage = async (
  transport,
  appPrivateKey,
  coinType,
  message,
  addressIndex,
  publicKey,
  isHashRequired = false
) => {
  const keyId = core.util.addressIndexToKeyId(coinType, addressIndex)

  let msgBuf
  let preAction

  if (web3.utils.isHex(message)) {
    msgBuf = Buffer.from(ethUtil.removeHex0x(message), 'hex')
  } else {
    msgBuf = Buffer.from(message, 'utf8')
  }

  if (isHashRequired) {
    preAction = ethUtil.apduForParsingMessage(msgBuf, '07') // send prehashed message to card
    msgBuf =  Buffer.from(web3.utils.keccak256(msgBuf), 'hex')
  }

  const len = msgBuf.length.toString()
  const prefix = Buffer.from('\u0019Ethereum Signed Message:\n' + len)
  const payload = Buffer.concat([prefix, msgBuf])

  const dataForSE = core.flow.prepareSEData(keyId, payload, 'F5')

  const { signature: canonicalSignature, cancel } = await core.flow.sendDataToCoolWallet(
    transport,
    appPrivateKey,
    dataForSE,
    '00',
    '00',
    false,
    preAction
  )

  if (cancel) return

  const { v, r, s } = await ethUtil.genEthSigFromSESig(canonicalSignature, payload, publicKey)
  const signature = '0x' + r + s + v.toString(16)
  return signature
}

/**
 * @description Sign Typed Data
 * @param {Transport} transport
 * @param {String} appPrivateKey
 * @param {String} coinType
 * @param {Object} typedData
 * @param {String} addressIndex
 * @param {Stirng} publicKey
 * @return {Promise<String>}
 */
export const signTypedData = async (transport, appPrivateKey, coinType, typedData, addressIndex, publicKey) => {
  const keyId = core.util.addressIndexToKeyId(coinType, addressIndex)

  const sanitizedData = typedDataUtils.sanitizeData(typedData)
  const encodedData = typedDataUtils.encodeData(sanitizedData.primaryType, sanitizedData.message, sanitizedData.types)
  const preAction = ethUtil.apduForParsingMessage(encodedData, '09')

  const prefix = Buffer.from('1901', 'hex')
  const domainSeparate = typedDataUtils.hashStruct('EIP712Domain', sanitizedData.domain, sanitizedData.types)
  const dataHash = Buffer.from(web3.utils.sha3(encodedData).substr(2), 'hex')
  const payload = Buffer.concat([prefix, domainSeparate, dataHash])
  console.log(`sign typed data payload : ${payload.toString('hex')}`)
  const dataForSE = core.flow.prepareSEData(keyId, payload, 'F3')

  const { signature: canonicalSignature, cancel } = await core.flow.sendDataToCoolWallet(
    transport,
    appPrivateKey,
    dataForSE,
    '00',
    '00',
    false,
    preAction
  )

  if (cancel) return

  const { v, r, s } = await ethUtil.genEthSigFromSESig(canonicalSignature, payload, publicKey)
  const signature = '0x' + r + s + v.toString(16)

  return signature
}
