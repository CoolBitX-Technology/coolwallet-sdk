import * as icx from './icx_sign'
import { pubKeyToAddress } from './icx_util'
import { ECDSACoin } from '@coolwallets/coin'

export default class ICX extends ECDSACoin {
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

  async signTransaction(transaction, addressIndex, publicKey, confirmCB=null, authorizedCB=null) {
    if (!publicKey) publicKey = await this.getPublicKey(addressIndex)
    return await icx.signTransaction(
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
}
