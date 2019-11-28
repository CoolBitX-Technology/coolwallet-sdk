import { executeCommand } from './execute'
import { RESPONSE } from '../config/response'

/**
 * Send sign data to CoolWalletS
 * @param {Transport} transport
 * @param {string} payload
 * @param {string} P1
 * @param {string} P2
 * @return {Promise<string>}
 */
export const prepTx = async (transport, payload, P1, P2) => {
  const { outputData: encryptedSignature } = await executeCommand(transport, 'TX_PREPARE', 'SE', payload, P1, P2)
  return encryptedSignature
}

/**
 * Scriptable step 1
 * @todo append signature
 * @param {Transport} transport 
 * @param {string} script 
 */
export const sendScript = async (transport, script ) => {
  const { status } = await executeCommand(transport, 'SEND_SCRIPT', 'SE', script)
  return status === RESPONSE.SUCCESS
}

/**
 * Scriptable step 2
 * @param {*} transport 
 * @param {*} argument 
 */
export const executeScript = async (transport, argument) => {
  const { outputData: encryptedSignature } = await executeCommand(transport, 'EXECUTE_SCRIPT', 'SE', argument)
  return encryptedSignature
}

export const getSignedHex = async (transport) => {
  const { outputData: signedTx } = await executeCommand(transport, 'GET_SIGNED_HEX', 'SE')
  return signedTx
}

/**
 * Inform CoolWalletS that tx_prepare is completed.
 * @param {Transport} transport
 * @return {Promse<boolean>}
 */
export const finishPrepare = async transport => {
  await executeCommand(transport, 'FINISH_PREPARE', 'SE')
  return true
}

/**
 * Get an one-time key to decrypt received signatures.
 * @param {Transport} transport
 * @return {Promise<string>}
 */
export const getSignatureKey = async transport => {
  const { outputData: signatureKey } = await executeCommand(transport, 'GET_TX_KEY', 'SE')
  return signatureKey
}

/**
 * Clear memory on CoolWalletS
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const clearTransaction = async transport => {
  await executeCommand(transport, 'CLEAR_TX', 'SE')
  return true
}

/**
 * get Transactino detail shown on hardware.
 * @param {Transport} transport
 * @return {Promise<boolean>} true: success, false: canceled.
 */
export const getTxDetail = async transport => {
  const { status } = await executeCommand(transport, 'GET_TX_DETAIL', 'SE')
  return status === RESPONSE.SUCCESS
}

/**
 * set built-in ERC20 token payload in CWS.
 * @param {Transport} transport
 * @param {string} payload
 * @param {number} sn 1: normal erc20, 2: second token in 0x.
 * @return {Promise<boolean>}
 */
export const setToken = async (transport, payload, sn = 1) => {
  const status = 
    sn === 1
      ? await executeCommand(transport, 'SET_ERC20_TOKEN', 'SE', payload)
      : await executeCommand(transport, 'SET_SECOND_ERC20_TOKEN', 'SE', payload)
  return status === RESPONSE.SUCCESS
}

/**
 * Set custom ERC20
 * @param {Transport} transport
 * @param {string} payload
 * @param {number} sn 1: normal erc20, 2: second token in 0x.
 * @return {Promise<boolean>}
 */
export const setCustomToken = async (transport, payload, sn = 1) => {
  const status =
    sn === 1
      ? await executeCommand(transport, 'SET_ERC20_TOKEN', 'SE', payload, '04', '18')
      : await executeCommand(transport, 'SET_SECOND_ERC20_TOKEN', 'SE', payload, '04', '18')
  return status === RESPONSE.SUCCESS
}

/**
 * Set change path
 * @param {Transport} transport
 * @param {string} pathWithSig data field
 * @param {string} redeemType P1
 * @return {Promise<boolean>}
 */
export const setChangeKeyId = async (transport, pathWithSig, redeemType) => {
  await executeCommand(transport, 'SET_CHANGE_KEYID', 'SE', pathWithSig, redeemType)
  return true
}
