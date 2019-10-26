import { executeCommand } from '../apdu'
import { ECIESenc } from '../crypto/encryptions'
import { SEPublicKey } from '../config/key'

export const getSEVersion = async transport => {
  const { outputData } = await executeCommand(transport, 'GET_SE_VERSION', 'SE')
  let SEVersion = parseInt(outputData, 16)
  console.log(`Got SE Version from CoolWalletS: ${SEVersion}`)
  return SEVersion
}

export const resetCard = async transport => {
    await executeCommand(transport, 'RESET_PAIR', 'SE')
    return true;
}

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
  const { outputData: appId } = await executeCommand(transport, 'REGISTER', 'SE', data, P1)
  return appId
}
