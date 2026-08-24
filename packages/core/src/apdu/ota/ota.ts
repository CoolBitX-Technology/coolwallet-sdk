import { executeCommand } from '../execute/execute';
import Transport, { CardType } from '../../transport';
import { commands } from '../execute/command';
import { target } from '../../config/param';
import { CODE } from '../../config/status/code';
import * as ProScript from '../script/pro/otaScript';
import * as GoScript from '../script/go/otaScript';
import { SDKError } from '../../error/errorHandle';
import Progress from './Progress';
import { getAPIOption, formatAPIResponse } from './api';
import { insertScript, insertLoadScript, insertDeleteScript } from './scripts';
import { backupRegisterData, recoverBackupData } from './backup';
import {
  MAIN_AID_PRO,
  CARDMANAGER_AID,
  SSD_AID,
  getNewSeVersion,
  getMainAppletAid,
  getChallengeUrl,
  getCryptogramUrl,
} from './constants';
import type { AppletStatus, APIOptions, SEUpdateInfo } from './types';
import { info, mcu, setting } from '../..';

const getScripts = (cardType: CardType) => {
  if (cardType === CardType.Pro) {
    return ProScript;
  } else if (cardType === CardType.Go) {
    return GoScript;
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
    const appletStatus = await selectApplet(transport, getMainAppletAid(transport.cardType));
    const hasApplet = appletStatus.status;
    return hasApplet;
  } catch (e) {
    console.error(e);
    return false;
  }
};

const getProgressNums = (updateMCU: boolean): Array<number> => {
  const progressNum = [14, 28, 36, 44, 50, 88, 100];
  return updateMCU ? progressNum.map((num) => Math.floor(num / 2)) : progressNum;
};

/**
 * The ignoreXxxError flags are the rescue path for cards stuck in an abnormal state (CW-29062):
 * every command going through the store interface returns 6F00, so the backup step blocks the
 * only way to repair the card. Each flag tolerates exactly one step. A tolerated pre-check
 * failure (checkBackupStatus / getCardInfo) falls back to the assumption that keeps trying to
 * back up (no backup yet / wallet created) and moves on to the next step, so a feasible backup
 * is never skipped. Only a tolerated backupRegisterData failure continues the update without
 * backup — which wipes the wallet on the card at the delete/install step.
 */
interface PerformBackupRegisterDataOptions {
  transport: Transport;
  appId: string;
  appPrivateKey: string;
  ignoreCheckBackupStatusError?: boolean;
  ignoreGetCardInfoError?: boolean;
  ignoreBackupRegisterDataError?: boolean;
}

const performBackupRegisterData = async ({
  transport,
  appId,
  appPrivateKey,
  ignoreCheckBackupStatusError = false,
  ignoreGetCardInfoError = false,
  ignoreBackupRegisterDataError = false,
}: PerformBackupRegisterDataOptions): Promise<void> => {
  const cardSEVersion = await safeGetSEVersion(transport);
  const hasBackupScriptSEVersion = 76;
  if (transport.cardType === CardType.Pro && cardSEVersion < hasBackupScriptSEVersion) return; // SEVersion lower than 76 cannot do backup.

  const isAppletExist = await safeCheckMainAppletExists(transport);
  if (!isAppletExist) return; // no need to do backup because no main applet.

  let hasBackup: boolean;
  try {
    hasBackup = await setting.backup.checkBackupStatus(transport);
  } catch (e) {
    if (!ignoreCheckBackupStatusError) throw e;
    console.warn(`checkBackupStatus failed, assume no backup and continue. error: ${e}`);
    hasBackup = false; // 查不到就當作沒有備份，繼續往下嘗試做備份；就算其實已有備份，重寫的也是同一份資料
  }
  if (hasBackup) return; // no need to do backup because backup already exists.

  let walletCreated: boolean;
  try {
    ({ walletCreated } = await info.getCardInfo(transport));
  } catch (e) {
    if (!ignoreGetCardInfoError) throw e;
    console.warn(`getCardInfo failed, assume wallet created and continue. error: ${e}`);
    walletCreated = true; // 查不到就當作有錢包，寧可多做一次備份嘗試，避免漏備份就往下更新
  }
  if (!walletCreated) return; // no need to do backup because wallet not created.

  try {
    console.debug('performBackupRegisterData >> backupRegisterData try');
    await backupRegisterData(transport, appId, appPrivateKey);
    console.debug('performBackupRegisterData >> backupRegisterData success');
  } catch (e) {
    if (!ignoreBackupRegisterDataError) throw e;
    console.warn(`backupRegisterData failed, continue firmware update without backup. error: ${e}`);
  }
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
  callAPI: (url: string, options: APIOptions) => Promise<Response>,
  apiSecret: string
): Promise<void> => {
  console.debug('mutual Authorization Start----');
  const options = await getAPIOption({ cardId, apiSecret });
  const challengeResponse = await callAPI(getChallengeUrl(transport.cardType), options);
  console.debug('cardID: ', cardId);
  const challengeObj = await formatAPIResponse(transport, challengeResponse);
  const challengeOptions = await getAPIOption({ cardId, challengeData: challengeObj.outputData, apiSecret });
  const cryptogramResponse = await callAPI(getCryptogramUrl(transport.cardType), challengeOptions);
  await formatAPIResponse(transport, cryptogramResponse);
  console.debug('mutual Authorization Done----');
};

interface UpdateSeParams {
  transport: Transport;
  cardId: string;
  appId: string;
  appPrivateKey: string;
  progressCallback: (progress: number) => void;
  callAPI: (url: string, options: APIOptions) => Promise<any>;
  updateMCU?: boolean;
  apiSecret: string;
  loadScript?: string;
  ignoreCheckBackupStatusError?: boolean;
  ignoreGetCardInfoError?: boolean;
  ignoreBackupRegisterDataError?: boolean;
}

/**
 *
 * @param transport
 * @param cardId ex: CWS0123456
 * @param appId
 * @param appPrivateKey
 * @param progressCallback progressCallback(progressNum): return update progress percentage
 * @param callAPI callAPI(url, options): Function of calling api
 * @param updateMCU
 * @param loadScript override the default loadScript; used for testing specific firmware versions
 */
export const updateSE = async ({
  transport,
  cardId,
  appId,
  appPrivateKey,
  progressCallback,
  callAPI,
  updateMCU = false,
  apiSecret,
  loadScript,
  ignoreCheckBackupStatusError,
  ignoreGetCardInfoError,
  ignoreBackupRegisterDataError,
}: UpdateSeParams): Promise<number> => {
  const SCRIPT = getScripts(transport.cardType);
  const progress = new Progress(getProgressNums(updateMCU));

  try {
    if (transport.cardType === CardType.Pro) await mcu.display.showUpdate(transport);

    progressCallback(progress.current()); // progress 14
    await performBackupRegisterData({
      transport,
      appId,
      appPrivateKey,
      ignoreCheckBackupStatusError,
      ignoreGetCardInfoError,
      ignoreBackupRegisterDataError,
    });

    // get ssd applet and authorize
    progressCallback(progress.next()); // progress 28
    await selectApplet(transport, SSD_AID);

    progressCallback(progress.next()); // progress 36
    await performApiChallenge(transport, cardId, callAPI, apiSecret);

    progressCallback(progress.next()); // progress 44
    await insertDeleteScript(transport, SCRIPT.deleteScript);
    console.debug('Delete Card Manager Done');

    progressCallback(progress.next()); // progress 50
    await insertLoadScript(
      transport,
      loadScript ?? SCRIPT.loadScript,
      progressCallback,
      progress.current(),
      progress.next()
    ); // From progress 50 to progress 88
    console.debug('Load OTA Script Done');

    await insertScript(transport, SCRIPT.installScript);
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
      console.error(`APDU.ota.updateSE Failed ${e}`);
    }
    throw new SDKError(updateSE.name, `${e}, 'SE Update Failed', '00000', 'SEUpdate'`);
  }
};

export const updateSEPart1 = async ({
  transport,
  cardId,
  appId,
  appPrivateKey,
  progressCallback,
  callAPI,
  updateMCU = false,
  apiSecret,
  loadScript,
  ignoreCheckBackupStatusError,
  ignoreGetCardInfoError,
  ignoreBackupRegisterDataError,
}: UpdateSeParams): Promise<void> => {
  const SCRIPT = getScripts(transport.cardType);
  const progress = new Progress(getProgressNums(updateMCU));

  try {
    if (transport.cardType === CardType.Pro) {
      await mcu.display.showUpdate(transport);
    }

    progressCallback(progress.current()); // progress 14
    console.log('updateSEPart1 >> performBackupRegisterData');
    await performBackupRegisterData({
      transport,
      appId,
      appPrivateKey,
      ignoreCheckBackupStatusError,
      ignoreGetCardInfoError,
      ignoreBackupRegisterDataError,
    });

    // get ssd applet and authorize
    progressCallback(progress.next()); // progress 28
    console.log('updateSEPart1 >> selectApplet(transport, SSD_AID)');
    await selectApplet(transport, SSD_AID);

    progressCallback(progress.next()); // progress 36
    console.log('updateSEPart1 >> performApiChallenge');
    await performApiChallenge(transport, cardId, callAPI, apiSecret);

    progressCallback(progress.next()); // progress 44
    console.log('updateSEPart1 >> insertDeleteScript');
    await insertDeleteScript(transport, SCRIPT.deleteScript);
    console.debug('Delete Card Manager Done');

    progressCallback(progress.next()); // progress 50
    console.log('updateSEPart1 >> insertLoadScript');
    await insertLoadScript(
      transport,
      loadScript ?? SCRIPT.loadScript,
      progressCallback,
      progress.current(),
      progress.next()
    ); // From progress 50 to progress 88
    console.debug('Load OTA Script Done');

    console.log('updateSEPart1 >> insertScript');
    await insertScript(transport, SCRIPT.installScript);
    console.debug('Insert Install Script Done');

    if (transport.cardType === CardType.Pro) {
      await mcu.display.hideUpdate(transport); // Hide update from the card
    }
  } catch (e) {
    try {
      if (transport.cardType === CardType.Pro) await mcu.display.hideUpdate(transport);
    } catch (ex) {
      console.error(`APDU.Other.finishUpdate Failed ${e}`);
    }
    throw new SDKError(updateSE.name, `${e}, 'SE Update Failed', '00000', 'SEUpdate'`);
  }
};

export const updateSEPart2 = async ({ transport }: { transport: Transport }): Promise<number> => {
  console.debug('updateSEPart2 >> selectApplet(transport, CARDMANAGER_AID)');
  await selectApplet(transport, CARDMANAGER_AID);

  console.debug('updateSEPart2 >> performRecoverBackupData');
  await performRecoverBackupData(transport);

  console.debug('updateSEPart2 >> Install OTA Script (SE Update) Done');
  return getNewSeVersion(transport.cardType);
};
