import { executeCommand } from './execute';
import { RESPONSE } from '../config/response';
import Transport from '../transport';
import { commands } from "./command";

/**
 * backup seed in SE.
 * @param {Transport} transport
 * @param {string} signedCommand
 * @return {Promise<boolean>}
 */
export const backupSeed = async (transport: Transport, signedCommand: string): Promise<boolean> => {
  const { status } = await executeCommand(transport, commands.BACKUP_REGISTER_DATA, 'SE', signedCommand);
  return status === RESPONSE.SUCCESS;
};

/**
 * Recover wallet automatically with backed up seed.
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const recoverSeed = async (transport: Transport): Promise<boolean> => {
  await executeCommand(transport, commands.RECOVER_REGISER_DATA, 'SE');
  return true;
};

/**
 * check if there's backed up data in SE.
 * @param {Transport} transport
 * @return {Promise<boolean>} true: may need recovery after update.
 */
export const checkBackupStatus = async (transport: Transport): Promise<boolean> => {
  const { outputData } = await executeCommand(transport, commands.CHECK_BACKUP_RECOVER, 'SE');
  return outputData === '01';
};

/**
 * Delete backed up seed in SE.
 * @param {Transport} transport
 * @param {string} signedCommand
 * @return {Promise<boolean>}
 */
export const deleteSeedBackup = async (transport: Transport, signedCommand: string) => {
  const { status } = await executeCommand(transport, commands.DELETE_REGISTER_BACKUP, 'SE', signedCommand);
  return status === RESPONSE.SUCCESS;
};
