import { wallet as apdu } from '../apdu'
import { SEPublicKey } from '../config/key'
import { generalAuthorization } from '../core/auth'
import { ECIESenc } from '../crypto/encryptions'

export default class CWSWallet {
  constructor(transport, appPublicKey, appPrivateKey, appId) {
    this.transport = transport
    this.appPublicKey = appPublicKey
    this.appPrivateKey = appPrivateKey
    this.appId = appId

    this.createWallet = this.createWallet.bind(this)
    this.sendCheckSum = this.sendCheckSum.bind(this)
    this.setSeed = this.setSeed.bind(this)
  }

  /**
   * Create a new seed with SE.
   * @param {Number} strength 12, 16, 24
   * @return {Promise<boolean>}
   */
  async createWallet(strength) {
    let strengthHex = strength.toString(16)
    if (strengthHex.length % 2 > 0) strengthHex = '0' + strengthHex
    const signature = await generalAuthorization(this.transport, this.appId, this.appPrivateKey, 'CREATE_WALLET', strengthHex)
    const strengthWithSig = strengthHex + signature
    return await apdu.createWallet(this.transport, strengthWithSig)
  }

  /**
   * Send sum of number seeds.
   * @param {number} checkSum
   * @return {Promise<boolean>}
   */
  async sendCheckSum(checkSum) {
    let sumHex = checkSum.toString(16).padStart(8, '0')
    return await apdu.submitCheckSum(this.transport, sumHex)
  }

  /**
   * @param {string} seedHex
   * @return {Promise<boolean>}
   */
  async setSeed(seedHex) {
    const encryptedSeed = ECIESenc(SEPublicKey, seedHex)
    const signature = await generalAuthorization(this.transport, this.appId, this.appPrivateKey, 'SET_SEED', encryptedSeed)
    const signedSeed = encryptedSeed + signature;
    return await apdu.setSeed(this.transport, signedSeed)
  }
}
