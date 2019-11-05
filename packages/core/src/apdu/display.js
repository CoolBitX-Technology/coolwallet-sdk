import { executeCommand } from './execute'

/**
 * Display "UPDATE" on wallet display
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const showUpdate = async transport => {
  await executeCommand(transport, 'START_UPDATE', 'SE')
  return true
}

/**
 * Hide "UPDATE" on card
 * @param {Transport}
 * @return {Promise<boolean>}
 */
export const hideUpdate = async transport => {
  await executeCommand(transport, 'FINISH_UPDATE', 'SE')
  return true
}

/**
 * Upate balances shown on card display
 * @param {Transport} transport
 * @param {string} data
 * @return {Promise<boolean>}
 */
export const updateBalance = async (transport, data) => {
  await executeCommand(transport, 'UPDATE_BALANCE', 'SE', data)
  return true
}
