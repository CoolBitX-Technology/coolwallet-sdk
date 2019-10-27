import * as derivation from './keyDerivation'

export default class CWSWallet {
  constructor(transport, appPublicKey, appPrivateKey, appId) {
    this.transport = transport
    this.appPublicKey = appPublicKey
    this.appPrivateKey = appPrivateKey
    this.appId = appId

    this.getAccountExtKey = this.getAccountExtKey.bind(this)
    this.getEd25519PublicKey = this.getEd25519PublicKey.bind(this)
  }

  async getAccountExtKey(coinType, accIndex, authFirst = true) {
    return await derivation.getAccountExtKey(this.transport, this.appId, this.appPrivateKey, coinType, accIndex, authFirst)
  }

  async getEd25519PublicKey(coinType, accIndex, authFirst = true) {
    return await derivation.getEd25519PublicKey(this.transport, this.appId, this.appPrivateKey, coinType, accIndex, authFirst)
  }

}
