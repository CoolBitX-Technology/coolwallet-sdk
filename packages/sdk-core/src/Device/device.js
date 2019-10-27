import * as apdu from '../apdu/device'
import { ECIESenc } from '../crypto/encryptions'
import { SEPublicKey } from '../config/key'

/**
 * @param {string} appPublicKey
 * @param {Transport}
 * @param {String} password
 * @param {String} device_name
 * @returns {Promise}
 */
export const registerDevice = async (appPublicKey, transport, password, device_name) => {
  let nameToUTF = Buffer.from(device_name, 'utf8')
  const maxLen = 30

  if (nameToUTF.length < maxLen) {
    let diff = maxLen - nameToUTF.length
    let temp = Buffer.allocUnsafe(diff)
    temp.fill(0)
    nameToUTF = Buffer.concat([temp, nameToUTF])
  } else {
    nameToUTF = nameToUTF.slice(0, maxLen)
  }
  const addedPassword = password.padStart(8, 'F')

  nameToUTF = nameToUTF.toString('hex')
  let data = addedPassword + appPublicKey + nameToUTF,
    P1 = '00'

  const supportEncryptedRegister = true
  if (supportEncryptedRegister) {
    data = ECIESenc(SEPublicKey, data)
    P1 = '01'
  }
  const appId = await apdu.registerDevice(transport, data, P1)
  return appId
}
