import * as pairing from '../pairing'
import * as creation from '../create'
import { apdu } from 'sdk-core'

export default class Wallet {
  constructor(transport, appPrivateKey, appId = undefined) {
    this.transport = transport
    this.appPrivateKey = appPrivateKey
    this.appId = appId

    this.setAppId = this.setAppId.bind(this)
    this.getSEVersion = this.getSEVersion.bind(this)
    this.register = this.register.bind(this)
    this.resetCard = this.resetCard.bind(this)
    this.getPairingPassword = this.getPairingPassword.bind(this)
  }

  setAppId(appId) {
    this.appId = appId
  }

  async getSEVersion() {
    return await apdu.setting.getSEVersion(this.transport)
  }

  async resetCard() {
    return await apdu.setting.resetCard(this.transport)
  }

  async register(appPublicKey, password, deviceName) {
    return await pairing.register(this.transport, appPublicKey, password, deviceName)
  }

  async getPairingPassword() {
    return await pairing.getPairingPassword(this.transport, this.appId, this.appPrivateKey)
  }

  // For wallet creation
  async createWallet(strength) {
    return await creation.createWallet(this.transport, this.appId, this.appPrivateKey, strength)
  }

  async sendCheckSum(sum){
      return await creation.sendCheckSum(this.transport, sum)
  }

  async setSeed(seedHex) {
    return await creation.setSeed(this.transport, this.appId, this.appPrivateKey, seedHex)
  }
}
