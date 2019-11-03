import * as ethSign from './eth_sign'
import { pubKeyToAddress } from './eth_utils'
import { ECDSACoin, core } from '@coolwallets/sdk-core'

export default class ETH extends ECDSACoin {
  constructor(transport, appPrivateKey, appId) {
    super(transport, appPrivateKey, appId, '3C')
  }

  /**
   * Get Ethereum address by index
   * @param {number} addressIndex
   * @return {string}
   */
  async getAddress(addressIndex) {
    const { publicKey } = await this.getPublicKey(addressIndex)
    console.log(`pubkeyu ${publicKey}`)
    return pubKeyToAddress(publicKey)
  }

  /**
   * Sign Ethereum Transaction.
   * @param {String} payload
   * @param {Number} addressIndex
   * @param {String} publicKey
   */
  async signTransaction(payload, addressIndex, publicKey = undefined) {
    if (!publicKey) publicKey = (await this.getPublicKey(addressIndex)).publicKey
    return await ethSign.signTransaction(
      this.transport,
      this.appPrivateKey,
      this.coinType,
      payload,
      addressIndex,
      publicKey
    )
  }

  /**
   * Sign Arbitrary Message.
   * @param {String} message hex or utf-8
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Boolean} isHashRequired
   * @return {Promise<String>}
   */
  async signMessage(message, addressIndex, publicKey = undefined, isHashRequired = false) {
    await core.auth.versionCheck(this.transport, 81)
    if (!publicKey) publicKey = (await this.getPublicKey(addressIndex)).publicKey
    return await ethSign.signMessage(
      this.transport,
      this.appPrivateKey,
      this.coinType,
      message,
      addressIndex,
      publicKey,
      isHashRequired
    )
  }

  /**
   * Sign EIP712 typed data
   * @param {Object} typedData
   * @param {String} addressIndex
   * @param {String} publicKey
   * @return {Object}
   */
  async signTypedData(typedData, addressIndex, publicKey = undefined) {
    await core.auth.versionCheck(this.transport, 84)
    if (!publicKey) publicKey = (await this.getPublicKey(addressIndex)).publicKey
    return await ethSign.signTypedData(
      this.transport,
      this.appPrivateKey,
      this.coinType,
      typedData,
      addressIndex,
      publicKey
    )
  }
}
