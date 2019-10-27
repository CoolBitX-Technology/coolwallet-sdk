export class ECDSACoin {
  constructor(wallet, coinType) {
    this.wallet = wallet
    this.coinType = coinType
  }

  /**
   * For ECDSA based coins
   * @param {Number} addressIndex address index in BIP44 pointing to the target public key.
   * @returns {Promise<{publicKey: string, parentPublicKey: string, parentChainCode: string}>}
   */
  async getPublicKey(addressIndex) {
    return await this.wallet.getECDSAPublicKey(this.coinType, addressIndex)
  }
}

export class EDDSACoin {
  constructor(wallet, coinType) {
    this.wallet = wallet
    this.coinType = coinType
  }

  /**
   * For ECDSA based coins
   * @dev Temporarily only support 0 as account Index for speed optimization.
   * If you pass in accountIndex > 0, it will return the same publicKey.
   * @param {Number} accountIndex account index in BIP32 pointing to the target public key.
   * @returns {Promise<string>}
   */
  async getPublicKey(accountIndex) {
    return await this.wallet.getEd25519PublicKey(this.coinType, accountIndex)
  }
}
