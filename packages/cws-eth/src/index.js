import * as ethSign from './eth_sign'
import { pubKeyToAddress } from './eth_utils'
import { core } from '@coolwallets/core'
import { ECDSACoin } from '@coolwallets/coin'

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
    const publicKey = await this.getPublicKey(addressIndex)
    return pubKeyToAddress(publicKey)
  }

  /**
   * Sign Ethereum Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string, value:string, data:string, chainId: number}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signTransaction(transaction, addressIndex, publicKey = undefined, confirmCB = null, authorizedCB = null) {
    if (!publicKey) publicKey = await this.getPublicKey(addressIndex)
    return await ethSign.signTransaction(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      transaction,
      addressIndex,
      publicKey,
      confirmCB,
      authorizedCB
    )
  }

  async signTransferNew(transaction, addressIndex, publicKey, confirmCB=null, authorizedCB=null) {
    if (!publicKey) publicKey = await this.getPublicKey(addressIndex)
    return await ethSign.signTransactionNew(
      this.transport,
      this.appId,
      this.appPrivateKey,
      transaction,
      addressIndex,
      publicKey,
      confirmCB,
      authorizedCB
    )
  }

  /**
   * Sign Arbitrary Message.
   * @param {String} message hex or utf-8
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Boolean} isHashRequired
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   * @return {Promise<String>}
   */
  async signMessage(message, addressIndex, publicKey = undefined, isHashRequired = false, confirmCB = null, authorizedCB = null) {
    await core.auth.versionCheck(this.transport, 81)
    if (!publicKey) publicKey = await this.getPublicKey(addressIndex)
    return await ethSign.signMessage(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      message,
      addressIndex,
      publicKey,
      isHashRequired,
      confirmCB,
      authorizedCB
    )
  }

  /**
   * Sign EIP712 typed data
   * @param {Object} typedData
   * @param {String} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   * @return {Object}
   */
  async signTypedData(typedData, addressIndex, publicKey = undefined, confirmCB = null, authorizedCB = null) {
    await core.auth.versionCheck(this.transport, 84)
    if (!publicKey) publicKey = await this.getPublicKey(addressIndex)
    return await ethSign.signTypedData(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      typedData,
      addressIndex,
      publicKey,
      confirmCB,
      authorizedCB
    )
  }
}
