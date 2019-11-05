import * as derivation from './derive'

export default class EDDSACoin {
  constructor(transport, appPrivateKey, appId, coinType) {
    this.transport = transport
    this.appPrivateKey = appPrivateKey
    this.appId = appId
    this.coinType = coinType

    this.getPublicKey = this.getPublicKey.bind(this)
  }

  /**
   * For EdDSA based coins
   * @dev Temporarily only support 0 as account Index for speed optimization.
   * If you pass in accountIndex > 0, it will return the same publicKey.
   * @param {Number} accountIndex account index in BIP32 pointing to the target public key.
   * @returns {Promise<string>}
   */
  async getPublicKey(accountIndex) {
    return await derivation.getEd25519PublicKey(this.transport, this.appId, this.appPrivateKey, this.coinType, accountIndex)
  }
}
