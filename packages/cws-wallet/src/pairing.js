import { apdu, crypto, config, core  } from '@coolwallets/core'

/**
 * @param {Transport} transport
 * @param {string} appPublicKey
 * @param {String} password
 * @param {String} device_name
 * @returns {Promise}
 */
export const register = async (transport, appPublicKey, password, device_name) => {
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
    data = crypto.encryption.ECIESenc(config.KEY.SEPublicKey, data)
    P1 = '01'
  }
  const appId = await apdu.pairing.registerDevice(transport, data, P1)
  return appId
}

/**
 * Get Pairing password for current device
 * @param {Transport} transport 
 * @param {string} appId 
 * @param {string} appPrivKey 
 * @return {Promise<string>}
 */
export const getPairingPassword = async (transport, appId, appPrivKey) => {
  const signature = await core.auth.generalAuthorization(transport, appId, appPrivKey, 'GET_PAIR_PWD');
  const encryptedPassword = await apdu.pairing.getPairingPassword(transport, signature);
  await apdu.control.powerOff(transport)
  
  let password = crypto.encryption.ECIESDec(appPrivKey, encryptedPassword);
  password = password.replace(/f/gi, '');
  return password
}