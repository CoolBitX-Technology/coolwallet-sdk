import { executeCommand } from './execute'

/**
 * Pair current device with CWS card
 * @param {string} data
 * @param {string} P1
 * @return {Promise<string>} appId
 */
export const registerDevice = async (transport, data, P1) => {
  const { outputData: appId } = await executeCommand(transport, 'REGISTER', 'SE', data, P1)
  return appId
}

/**
 * get ENCRYPTED pairing password
 * @param {Transport} transport
 * @param {string} data
 * @return {Promise<string>}
 */
export const getPairingPassword = async (transport, data) => {
  const { outputData } = await executeCommand(transport, 'GET_PAIR_PWD', 'SE', data)
  return outputData
}


/**
 * Get list of paired devices
 * @param {Transport} transport
 * @param {string} signature
 * @return {Promise<Array<{appId:string, deviceName: string}>>}
 */
export const getPairedDevices = async (transport, signature) => {
  const { outputData } = await executeCommand(transport, 'GET_PAIRED_DEVICES', 'SE', signature)
  const devices = outputData.match(/.{100}/g)
  const allDevices = devices.map(device => {
    const appId = device.slice(0, 40)
    const utfDevicename = device.slice(40)
    const toBuf = Buffer.from(utfDevicename, 'hex')
    const deviceName = toBuf.toString().replace(/\u0000/gi, '')
    return { appId, deviceName }
  })
  return allDevices
}

/**
 * Remove Paired device by id
 * @param {Transport} transport
 * @param {string} appIdWithSig
 * @return {Promise<boolean>}
 */
export const removePairedDevice = async (transport, appIdWithSig) => {
  await executeCommand(transport, 'REMOVE_DEVICES', 'SE', appIdWithSig)
  return true
}

/**
 * Rename current device
 * @param {Transport} transport
 * @param {string} nameWithSig
 * @return {Promise<boolean>}
 */
export const renameDevice = async (transport, nameWithSig) => {
  await executeCommand(transport, 'RENAME_DEVICES', 'SE', nameWithSig)
  return true
}