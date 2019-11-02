import * as device from './device'
import * as deviceApdu from '../apdu/device'

export default class CWSDevice {
  constructor(transport, appPrivateKey, appId=undefined) {
    this.transport = transport
    this.appPrivateKey = appPrivateKey
    this.appId = appId

    this.setAppId = this.setAppId.bind(this)
    this.getSEVersion = this.getSEVersion.bind(this)
    this.registerDevice = this.registerDevice.bind(this)
    this.resetCard = this.resetCard.bind(this)
    this.getPairingPassword = this.getPairingPassword.bind(this)
  }
  
  setAppId(appId) {
    this.appId = appId 
  }

  async getSEVersion() {
    return await deviceApdu.getSEVersion(this.transport)
  }

  async resetCard() {
    return await deviceApdu.resetCard(this.transport)
  }

  async registerDevice(appPublicKey, password, deviceName) {
    return await device.registerDevice(this.transport, appPublicKey, password, deviceName)
  }

  async getPairingPassword(){
    return await device.getPairingPassword(this.transport, this.appId, this.appPrivateKey)
  }
}
