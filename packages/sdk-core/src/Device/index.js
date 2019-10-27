import * as device from './device'
import * as deviceApdu from '../apdu/device'

export default class CWSDevice {
  constructor(transport, appPublicKey, appPrivateKey) {
    this.transport = transport
    this.appPublicKey = appPublicKey
    this.appPrivateKey = appPrivateKey
    this.getSEVersion = this.getSEVersion.bind(this)
    this.registerDevice = this.registerDevice.bind(this)
    this.resetCard = this.resetCard.bind(this)
  }

  async getSEVersion() {
    return await deviceApdu.getSEVersion(this.transport)
  }

  async resetCard() {
    return await deviceApdu.resetCard(this.transport)
  }

  async registerDevice(password, deviceName) {
    return await device.registerDevice(this.appPublicKey, this.transport, password, deviceName)
  }
}
