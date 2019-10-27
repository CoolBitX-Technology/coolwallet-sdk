import * as derivation from '../core/derive'

export default class CWSWallet {
  constructor(transport, appPublicKey, appPrivateKey, appId) {
    this.transport = transport
    this.appPublicKey = appPublicKey
    this.appPrivateKey = appPrivateKey
    this.appId = appId

    this.getECDSAPublicKey = this.getECDSAPublicKey.bind(this)
    this.getEd25519PublicKey = this.getEd25519PublicKey.bind(this)
  }

  async getECDSAPublicKey(coinType, addrIndex) {
    return await derivation.getECDSAPublicKey(this.transport, this.appId, this.appPrivateKey, coinType, addrIndex)
  }

  async getEd25519PublicKey(coinType, accIndex) {
    return await derivation.getEd25519PublicKey(this.transport, this.appId, this.appPrivateKey, coinType, accIndex)
  }
}
