import { executeCommand } from './execute/execute';
import Transport from '../transport';
import { commands } from "./execute/command";
import { target } from '../config/target';
import { CODE } from '../config/status/code';
import { SDKError, APDUError } from '../error/errorHandle';


/**
 * backup seed in SE.
 * @param {Transport} transport
 * @param {string} signedCommand
 * @return {Promise<{ status: boolean, statusCode: string, msg: string }>}
 */
export const backupSeed = async (transport: Transport, signedCommand: string): Promise<boolean> => {
  const { statusCode, msg } = await executeCommand(transport, commands.BACKUP_REGISTER_DATA, target.SE, signedCommand);
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(commands.BACKUP_REGISTER_DATA, statusCode, msg)
  }
};

/**
 * Recover wallet automatically with backed up seed.
 * @param {Transport} transport
 * @return {Promise<{ status: boolean, statusCode: string, msg: string }>}
 */
export const recoverSeed = async (transport: Transport): Promise<boolean> => {
  const { statusCode, msg } = await executeCommand(transport, commands.RECOVER_REGISER_DATA, target.SE);
  if (statusCode === CODE._9000) {
    return true
  } else {
    throw new APDUError(commands.RECOVER_REGISER_DATA, statusCode, msg)
  }
};

/**
 * check if there's backed up data in SE.
 * @param {Transport} transport
 * @return {Promise<{ status: boolean, statusCode: string, msg: string }>} true: may need recovery after update.
 */
export const checkBackupStatus = async (transport: Transport): Promise<boolean> => {
  const { statusCode, msg, outputData } = await executeCommand(transport, commands.CHECK_BACKUP_RECOVER, target.SE);
  if (outputData === '01') {
    return true
  } else {
    throw new APDUError(commands.CHECK_BACKUP_RECOVER, statusCode, msg)
  }
};

/**
 * Delete backed up seed in SE.
 * @param {Transport} transport
 * @param {string} signedCommand
 * @return {Promise<{ status: boolean, statusCode: string, msg: string }>}
 */
export const deleteSeedBackup = async (transport: Transport, signedCommand: string) => {
  const { statusCode, msg } = await executeCommand(transport, commands.DELETE_REGISTER_BACKUP, target.SE, signedCommand);
  if (statusCode === CODE._9000) {
    return true
  } else {
    throw new APDUError(commands.DELETE_REGISTER_BACKUP, statusCode, msg)
  }
};
