import { executeCommand } from '../execute/execute';
import Transport from '../../transport';
import { commands } from '../execute/command';
import { target } from '../../config/param';
import { CODE } from '../../config/status/code';
import * as SCRIPT from '../script/otaScript';
import { SDKError } from '../../error/errorHandle';
import Progress from './Progress';
import { getAPIOption, formatAPIResponse } from './api';
import { insertScript, insertLoadScript, insertDeleteScript } from './scripts';
import { backupRegisterData, deleteBackupRegisterData, recoverBackupData } from './backup';
import {
  SE_UPDATE_VER,
  CHALLENGE_URL,
  CRYPTOGRAM_URL,
  MAIN_AID,
  BACKUP_AID,
  CARDMANAGER_AID,
  SSD_AID,
} from './constants';
import type { AppletStatus, APIOptions, SEUpdateInfo } from './types';
import { common, info, mcu, setting } from '../..';

/**
 *
 * @param transport
 * @param appletCommand
 */
export const selectApplet = async (transport: Transport, appletCommand: string = MAIN_AID): Promise<AppletStatus> => {
  const { statusCode } = await executeCommand(transport, commands.SELECT_APPLET, target.SE, appletCommand);
  if (statusCode === CODE._9000) {
    return { status: true, statusCode };
  }
  return { status: false, statusCode };
};

export const checkUpdate = async (transport: Transport): Promise<SEUpdateInfo> => {
  let cardSEVersion;
  try {
    cardSEVersion = await info.getSEVersion(transport);
  } catch (error) {
    cardSEVersion = 0;
  }
  const isNeedUpdate = SE_UPDATE_VER > cardSEVersion;
  return { isNeedUpdate, curVersion: cardSEVersion, newVersion: SE_UPDATE_VER };
};

/**
 *
 * @param transport
 * @param cardId ex: CWS0123456
 * @param appId
 * @param appPrivateKey
 * @param progressCallback progressCallback(progressNum): return update progress percentage
 * @param callAPI callAPI(url, options): Function of calling api
 * @param updateMCU
 */
export const updateSE = async (
  transport: Transport,
  cardId: string,
  appId: string,
  appPrivateKey: string,
  progressCallback: (progress: number) => void,
  callAPI: (url: string, options: APIOptions) => Promise<any>,
  updateMCU = false
): Promise<number> => {
  // BackupApplet
  let cardSEVersion;
  try {
    cardSEVersion = await info.getSEVersion(transport);
  } catch (e) {
    console.error(e);
    cardSEVersion = 0;
  }
  let progressNum = [14, 28, 36, 44, 50, 88, 100];

  if (updateMCU) {
    progressNum = progressNum.map((num) => Math.floor(num / 2));
  }
  const progress = new Progress(progressNum);
  try {
    await mcu.display.showUpdate(transport);

    progressCallback(progress.current()); // progress 14

    const hasBackupScriptSEVersion = 76;
    let isAppletExist;
    try {
      isAppletExist = await selectApplet(transport);
    } catch (e) {
      console.error(e);
      isAppletExist = false;
    }

    if (isAppletExist) {
      if (cardSEVersion >= hasBackupScriptSEVersion) {
        const isCardRecognized = await common.hi(transport, appId);

        const { walletCreated } = await info.getCardInfo(transport);
        console.debug(`isCardRecognized: ${isCardRecognized}, walletStatus: ${walletCreated}`);

        if (isCardRecognized) {
          await deleteBackupRegisterData(transport, appId, appPrivateKey);
          if (walletCreated) {
            await backupRegisterData(transport, appId, appPrivateKey);
          }
        }
      }
    }

    await selectApplet(transport, CARDMANAGER_AID);
    const { statusCode } = await selectApplet(transport, BACKUP_AID);
    progressCallback(progress.next()); // progress 28
    console.debug(`selectBackUpSeedApplet statusCode: ${statusCode}`);

    // get ssd applet and authorize
    await selectApplet(transport, CARDMANAGER_AID);
    await selectApplet(transport, SSD_AID);
    progressCallback(progress.next()); // progress 36

    console.debug('mutual Authorization Start----');
    const options = await getAPIOption(cardId);
    const challengeResponse = await callAPI(CHALLENGE_URL, options);
    console.debug('cardID: ', cardId);
    const challengeObj = await formatAPIResponse(transport, challengeResponse);
    const challengeOptions = await getAPIOption(cardId, challengeObj.outputData);
    const cryptogramResponse = await callAPI(CRYPTOGRAM_URL, challengeOptions);
    await formatAPIResponse(transport, cryptogramResponse);
    console.debug('mutual Authorization Done----');

    progressCallback(progress.next()); // progress 4
    await insertDeleteScript(transport, SCRIPT.deleteScript);
    console.debug('Delete Card Manager Done');

    progressCallback(progress.next()); // progress 50
    // From progress 50 to progress 88
    await insertLoadScript(transport, SCRIPT.loadScript, progressCallback, progress.current(), progress.next());
    console.debug('Load OTA Script Done');

    await insertScript(transport, SCRIPT.installScript);

    await mcu.display.hideUpdate(transport); // Hide update from the card

    await selectApplet(transport, CARDMANAGER_AID);
    isAppletExist = await selectApplet(transport);
    console.debug(`isAppletExist: ${isAppletExist}`);

    if (isAppletExist) {
      // start recover backupData
      console.debug('Start checking recovery');
      const isNeedRecover = await setting.backup.checkBackupStatus(transport);
      console.debug(`isNeedRecover: ${isNeedRecover}`);
      if (isNeedRecover === true) {
        await recoverBackupData(transport);
      }
    }

    progressCallback(progress.next()); // progress 100
    console.debug('Install OTA Script (SE Update) Done');

    return SE_UPDATE_VER;
  } catch (e) {
    try {
      await mcu.display.hideUpdate(transport);
    } catch (ex) {
      console.error(`APDU.Other.finishUpdate Failed ${e}`);
    }
    throw new SDKError(updateSE.name, `${e}, 'SE Update Failed', '00000', 'SEUpdate'`);
  }
};
