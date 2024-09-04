import { executeCommand } from '../execute/execute';
import Transport, { CardType } from '../../transport';
import { commands } from '../execute/command';
import { target } from '../../config/param';
import { CODE } from '../../config/status/code';
import * as ProScript from '../script/pro/otaScript';
import * as LiteScript from '../script/lite/otaScript';
import { SDKError } from '../../error/errorHandle';
import Progress from './Progress';
import { getAPIOption, formatAPIResponse } from './api';
import { insertScript, insertLoadScript, insertDeleteScript } from './scripts';
import { backupRegisterData, deleteBackupRegisterData, recoverBackupData } from './backup';
import {
  CHALLENGE_URL,
  CRYPTOGRAM_URL,
  MAIN_AID_PRO,
  BACKUP_AID,
  CARDMANAGER_AID,
  SSD_AID,
  getNewSeVersion,
  getMainAppletAid,
} from './constants';
import type { AppletStatus, APIOptions, SEUpdateInfo } from './types';
import { common, info, mcu, setting } from '../..';

const getScripts = (cardType: CardType) => {
  if (cardType === CardType.Pro) {
    return ProScript;
  } else if (cardType === CardType.Lite) {
    return LiteScript;
  } else {
    throw new Error(`getScripts unknown cardType: ${cardType}`);
  }
};

const safeGetSEVersion = async (transport: Transport): Promise<number> => {
  try {
    return await info.getSEVersion(transport);
  } catch (e) {
    console.error(e);
    return 0;
  }
};

/**
 *
 * @param transport
 * @param appletCommand
 */
export const selectApplet = async (
  transport: Transport,
  appletCommand: string = MAIN_AID_PRO
): Promise<AppletStatus> => {
  const { statusCode } = await executeCommand(transport, commands.SELECT_APPLET, target.SE, appletCommand);
  if (statusCode === CODE._9000) {
    return { status: true, statusCode };
  }
  return { status: false, statusCode };
};

export const checkUpdate = async (transport: Transport): Promise<SEUpdateInfo> => {
  const newSeVersion = getNewSeVersion(transport.cardType);
  const cardSEVersion = await safeGetSEVersion(transport);
  return { isNeedUpdate: newSeVersion > cardSEVersion, curVersion: cardSEVersion, newVersion: newSeVersion };
};

const safeCheckMainAppletExists = async (transport: Transport): Promise<boolean> => {
  try {
    return !!(await selectApplet(transport, getMainAppletAid(transport.cardType)));
  } catch (e) {
    console.error(e);
    return false;
  }
};

const getProgressNums = (updateMCU: boolean): Array<number> => {
  const progressNum = [14, 28, 36, 44, 50, 88, 100];
  return updateMCU ? progressNum.map((num) => Math.floor(num / 2)) : progressNum;
};

const performBackupRegisterData = async (transport: Transport, appId: string, appPrivateKey: string): Promise<void> => {
  const cardSEVersion = await safeGetSEVersion(transport);
  const hasBackupScriptSEVersion = 76;
  if (transport.cardType === CardType.Pro && cardSEVersion < hasBackupScriptSEVersion) return; // SEVersion lower than 76 cannot do backup.

  const isAppletExist = await safeCheckMainAppletExists(transport);
  if (!isAppletExist) return; // no need to do backup because no main applet.

  const isCardRecognized = await common.hi(transport, appId);
  if (!isCardRecognized) return; // don't do backup becuase card cannot recognize device(appId).

  const { walletCreated } = await info.getCardInfo(transport);
  console.debug(`isCardRecognized: ${isCardRecognized}, walletStatus: ${walletCreated}`);

  await deleteBackupRegisterData(transport, appId, appPrivateKey);
  if (walletCreated) await backupRegisterData(transport, appId, appPrivateKey);
};

const performRecoverBackupData = async (transport: Transport): Promise<void> => {
  const isAppletExist = await safeCheckMainAppletExists(transport);
  if (!isAppletExist) return; // no need to recover because no main applet.

  console.debug('Start checking recovery');
  const isNeedRecover = await setting.backup.checkBackupStatus(transport);

  console.debug(`isNeedRecover: ${isNeedRecover}`);
  if (isNeedRecover === true) await recoverBackupData(transport);
};

const performApiChallenge = async (
  transport: Transport,
  cardId: string,
  callAPI: (url: string, options: APIOptions) => Promise<Response>
): Promise<void> => {
  console.debug('mutual Authorization Start----');
  const options = await getAPIOption(cardId);
  const challengeResponse = await callAPI(CHALLENGE_URL, options);
  console.debug('cardID: ', cardId);
  const challengeObj = await formatAPIResponse(transport, challengeResponse);
  const challengeOptions = await getAPIOption(cardId, challengeObj.outputData);
  const cryptogramResponse = await callAPI(CRYPTOGRAM_URL, challengeOptions);
  await formatAPIResponse(transport, cryptogramResponse);
  console.debug('mutual Authorization Done----');
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
  callAPI: (url: string, options: APIOptions) => Promise<Response>,
  updateMCU = false
): Promise<number> => {
  const progress = new Progress(getProgressNums(updateMCU));

  try {
    if (transport.cardType === CardType.Pro) await mcu.display.showUpdate(transport);

    progressCallback(progress.current()); // progress 14
    await performBackupRegisterData(transport, appId, appPrivateKey);
    await selectApplet(transport, CARDMANAGER_AID);
    await selectApplet(transport, BACKUP_AID);

    // get ssd applet and authorize
    progressCallback(progress.next()); // progress 28
    await selectApplet(transport, CARDMANAGER_AID);
    await selectApplet(transport, SSD_AID);

    progressCallback(progress.next()); // progress 36
    await performApiChallenge(transport, cardId, callAPI);

    progressCallback(progress.next()); // progress 44
    await insertDeleteScript(transport, getScripts(transport.cardType).deleteScript);
    console.debug('Delete Card Manager Done');

    progressCallback(progress.next()); // progress 50
    await insertLoadScript(
      transport,
      getScripts(transport.cardType).loadScript,
      progressCallback,
      progress.current(),
      progress.next()
    ); // From progress 50 to progress 88
    console.debug('Load OTA Script Done');

    await insertScript(transport, getScripts(transport.cardType).installScript);
    console.debug('Insert Install Script Done');

    if (transport.cardType === CardType.Pro) await mcu.display.hideUpdate(transport); // Hide update from the card
    await selectApplet(transport, CARDMANAGER_AID);
    await performRecoverBackupData(transport);

    progressCallback(progress.next()); // progress 100
    console.debug('Install OTA Script (SE Update) Done');
    return getNewSeVersion(transport.cardType);
  } catch (e) {
    try {
      if (transport.cardType === CardType.Pro) await mcu.display.hideUpdate(transport);
    } catch (ex) {
      console.error(`APDU.Other.finishUpdate Failed ${e}`);
    }
    throw new SDKError(updateSE.name, `${e}, 'SE Update Failed', '00000', 'SEUpdate'`);
  }
};
