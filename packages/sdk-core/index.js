import * as Device from './src/Device'
export { generateKeyPair } from './src/crypto/keyPair'

export class CWSDevice {
  constructor(transport, appPublicKey, appPrivateKey) {
      this.transport = transport;
      this.appPublicKey = appPublicKey;
      this.appPrivateKey = appPrivateKey;
      this.getSEVersion = this.getSEVersion.bind(this)
      this.registerDevice = this.registerDevice.bind(this)
      this.resetCard = this.resetCard.bind(this)
  }

  async getSEVersion() {
    return await Device.getSEVersion(this.transport)
  }

  async resetCard() {
    return await Device.resetCard(this.transport)
  }

  async registerDevice(password, deviceName) {
    return await Device.registerDevice(this.appPublicKey, this.transport, password, deviceName)
  }
}
