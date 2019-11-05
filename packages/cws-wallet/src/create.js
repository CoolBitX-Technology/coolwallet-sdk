import { apdu, core, crypto, config } from 'sdk-core'
const SEPublicKey = config.KEY.SEPublicKey

/**
 * Create a new seed with SE.
 * @param {transport} transport
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {Number} strength 12, 16, 24
 * @return {Promise<boolean>}
 */
export async function createWallet(transport, appId, appPrivateKey, strength) {
  let strengthHex = strength.toString(16)
  if (strengthHex.length % 2 > 0) strengthHex = '0' + strengthHex
  const signature = await core.auth.generalAuthorization(transport, appId, appPrivateKey, 'CREATE_WALLET', strengthHex)
  const strengthWithSig = strengthHex + signature
  return await apdu.wallet.createWallet(transport, strengthWithSig)
}

/**
 * Send sum of number seeds.
 * @param {transport}
 * @param {number} checkSum
 * @return {Promise<boolean>}
 */
export async function sendCheckSum(transport, checkSum) {
  let sumHex = checkSum.toString(16).padStart(8, '0')
  return await apdu.wallet.submitCheckSum(this.transport, sumHex)
}

/**
 * @param {Transport}
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {string} seedHex
 * @return {Promise<boolean>}
 */
export async function setSeed(transport, appId, appPrivateKey, seedHex) {
  const encryptedSeed = crypto.encryption.ECIESenc(SEPublicKey, seedHex)
  const signature = await core.auth.generalAuthorization(transport, appId, appPrivateKey, 'SET_SEED', encryptedSeed)
  const signedSeed = encryptedSeed + signature
  return await apdu.wallet.setSeed(transport, signedSeed)
}
