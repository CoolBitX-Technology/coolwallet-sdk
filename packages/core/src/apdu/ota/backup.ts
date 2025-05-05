import { commands } from '../execute/command';
import Transport from '../../transport';
import * as auth from '../../setting/auth';
import { SDKError } from '../../error/errorHandle';
import { setting } from '../..';

const backupRegisterData = async (transport: Transport, appId: string, appPrivateKey: string): Promise<void> => {
  try {
    const command = commands.BACKUP_REGISTER_DATA;
    const signature = await auth.getCommandSignature(transport, appId, appPrivateKey, command);
    console.debug(`backupRegisterData: ${signature}`);
    const status = await setting.backup.backupSeed(transport, signature);
    console.debug(`${backupRegisterData.name} status: ${status}`);
  } catch (e: any) {
    if (e.message) {
      console.error(`${backupRegisterData.name} fail: ${e.message}`);
    }
    throw new SDKError(backupRegisterData.name, `Backup register data failed ${e}`);
  }
};

const deleteBackupRegisterData = async (transport: Transport, appId: string, appPrivateKey: string): Promise<void> => {
  try {
    const command = commands.DELETE_REGISTER_BACKUP;
    const signedData = await auth.getCommandSignature(transport, appId, appPrivateKey, command);
    const status = await setting.backup.deleteSeedBackup(transport, signedData);
    console.debug(`${deleteBackupRegisterData.name} status: ${status}`);
  } catch (e: any) {
    if (e.message) {
      console.error(`${deleteBackupRegisterData.name} fail: ${e.message}`);
    }
    throw new SDKError(deleteBackupRegisterData.name, `Delete backup register data failed ${e}`);
  }
};

const recoverBackupData = async (transport: Transport): Promise<void> => {
  try {
    await setting.backup.recoverSeed(transport);
  } catch (e: any) {
    if (e.message) {
      console.error('[recoverBackupData] fail:', e.message);
    }
    throw new SDKError(recoverBackupData.name, `Recover backup data failed ${e}`);
  }
};

export { backupRegisterData, deleteBackupRegisterData, recoverBackupData };
