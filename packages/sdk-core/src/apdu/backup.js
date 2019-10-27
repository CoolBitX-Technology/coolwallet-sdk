import { executeCommand } from './execute'
import { RESPONSE } from '../config/response'

/**
 * backup seed in SE.
 * @param {Transport} transport
 * @param {string} signedCommand
 * @return {Promise<boolean>}
 */
export const backupRegisterData = async (transport, signedCommand) => {
  const { status } = await executeCommand(transport, 'BACKUP_REGISTER_DATA', 'SE', signedCommand)
  return status === RESPONSE.SUCCESS
}

/**
 * Recover wallet automatically with backed up seed.
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const recoverWithBackedUpData = async transport => {
  await executeCommand(transport, 'RECOVER_REGISER_DATA', 'SE')
  return true
}

/**
 * check if there's backed up data in SE.
 * @param {Transport} transport
 * @return {Promise<boolean>} true: may need recovery after update.
 */
export const checkBackuptatus = async transport => {
  const { outputData } = await executeCommand(transport, 'CHECK_BACKUP_RECOVER', 'SE')
  return outputData === '01'
}

/**
 * Delete backed up seed in SE.
 * @param {Transport} trasnport
 * @param {string} signedCommand
 * @return {Promise<boolean>}
 */
export const deleteSeedBackup = async (transport, signedCommand) => {
  const { status } = await executeCommand(transport, 'DELETE_REGISTER_BACKUP', 'SE', signedCommand)
  return status === RESPONSE.SUCCESS
}
