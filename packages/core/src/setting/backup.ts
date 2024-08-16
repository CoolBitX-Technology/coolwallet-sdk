import { auth } from '.';
import { error } from '..';
import { commands } from '../apdu/execute/command';
import { executeCommand } from '../apdu/execute/execute';
import { target } from '../config/param';
import { CODE } from '../config/status/code';
import { APDUError } from '../error/errorHandle';
import Transport, { CardType } from '../transport';

/**
 * backup seed in SE.
 * @param {Transport} transport
 * @param {string} signedCommand
 * @return {Promise<{ status: boolean, statusCode: string, msg: string }>}
 */
export const backupSeed = async (transport: Transport, signature: string): Promise<boolean> => {
  const { statusCode, msg } = await executeCommand(
    transport,
    commands.BACKUP_REGISTER_DATA,
    target.SE,
    signature,
    undefined,
    undefined
  );
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(commands.BACKUP_REGISTER_DATA, statusCode, msg);
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
    return true;
  } else {
    throw new APDUError(commands.RECOVER_REGISER_DATA, statusCode, msg);
  }
};

/**
 * check if there's backed up data in SE.
 * @param {Transport} transport
 * @return {boolean} 01 true: may need recovery after update. 00 false
 */
export const checkBackupStatus = async (transport: Transport): Promise<boolean> => {
  const { statusCode, msg, outputData } = await executeCommand(transport, commands.CHECK_BACKUP_RECOVER, target.SE);
  if (statusCode === CODE._9000) {
    return outputData === '01' ? true : false;
  } else {
    throw new APDUError(commands.CHECK_BACKUP_RECOVER, statusCode, msg);
  }
};

/**
 * Delete backed up seed in SE.
 * @param {Transport} transport
 * @param {string} signedCommand
 * @return {Promise<{ status: boolean, statusCode: string, msg: string }>}
 */
export const deleteSeedBackup = async (transport: Transport, signature: string): Promise<boolean> => {
  const { statusCode, msg } = await executeCommand(
    transport,
    commands.DELETE_REGISTER_BACKUP,
    target.SE,
    signature,
    undefined,
    undefined
  );
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(commands.DELETE_REGISTER_BACKUP, statusCode, msg);
  }
};

/**
 * Export backup data.
 * @param transport
 * @param appId
 * @param appPrivateKey
 * @param backupCardId
 * @returns
 */
export const exportBackupData = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  backupCardId: string
): Promise<string> => {
  if (transport.cardType === CardType.Pro) {
    throw new error.SDKError(exportBackupData.name, `CoolWallet PRO does not support this command.`);
  }
  const backupCardIdLength = new Uint8Array(2);
  const backupCardIdBuf = Buffer.from(backupCardId, 'hex');
  backupCardIdLength[0] = (backupCardIdBuf.length >> 8) & 0xff;
  backupCardIdLength[1] = backupCardIdBuf.length & 0xff;

  const data = Buffer.concat([
    Buffer.from(backupCardIdLength),
    backupCardIdBuf,
    // padding zero to trigger extended length
    Buffer.alloc(200),
  ]).toString('hex');
  const signature = await auth.getCommandSignature(transport, appId, appPrivateKey, commands.EXPORT_BACKUP_DATA, data);
  const { statusCode, msg, outputData } = await executeCommand(
    transport,
    commands.EXPORT_BACKUP_DATA,
    target.SE,
    data + signature,
    undefined,
    undefined
  );
  if (statusCode === CODE._9000) {
    return outputData;
  } else {
    throw new APDUError(commands.EXPORT_BACKUP_DATA, statusCode, msg);
  }
};

/**
 * Import backup data.
 * @param transport
 * @param backupData
 * @returns
 */
export const importBackupData = async (transport: Transport, backupData: string): Promise<string> => {
  if (transport.cardType === CardType.Pro) {
    throw new error.SDKError(importBackupData.name, `CoolWallet PRO does not support this command.`);
  }
  const { statusCode, msg } = await executeCommand(
    transport,
    commands.IMPORT_BACKUP_DATA,
    target.SE,
    backupData,
    undefined,
    undefined
  );
  if (statusCode === CODE._9000) {
    return msg;
  } else {
    throw new APDUError(commands.IMPORT_BACKUP_DATA, statusCode, msg);
  }
};
