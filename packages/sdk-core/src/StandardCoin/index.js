import * as derivation from '../core/derive'

export class ECDSACoin {
  constructor(transport, appPublicKey, appPrivateKey, appId, coinType) {
    this.transport = transport
    this.appPublicKey = appPublicKey
    this.appPrivateKey = appPrivateKey
    this.appId = appId
    this.coinType = coinType

    this.getPublicKey = this.getPublicKey.bind(this)
  }

  /**
   * For ECDSA based coins
   * @param {Number} addressIndex address index in BIP44 pointing to the target public key.
   * @returns {Promise<{publicKey: string, parentPublicKey: string, parentChainCode: string}>}
   */
  async getPublicKey(addressIndex) {
    const { accountPublicKey, accountChainCode } = await derivation.getAccountExtKey(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      0
    )
    const { publicKey } = derivePubKey(accountPublicKey, accountChainCode, 0, addressIndex)
    return publicKey
  }
}

export class EDDSACoin {
  constructor(transport, appPublicKey, appPrivateKey, appId, coinType) {
    this.transport = transport
    this.appPublicKey = appPublicKey
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
