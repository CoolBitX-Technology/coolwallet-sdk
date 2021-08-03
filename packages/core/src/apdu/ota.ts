import { executeCommand, executeAPDU } from './execute/execute';
import Transport from '../transport';
import { commands } from "./execute/command";
import { target } from '../config/param';
import { CODE } from '../config/status/code';
import * as general from './general';
import { Promise as promise } from 'bluebird';
import * as script from './script/otaScript';
import * as setting from './setting';
import * as informational from './informational';
import * as util from '../utils';
import * as auth from '../setting/auth';
import * as display from './mcu/display';
import { SDKError } from '../error/errorHandle';

var jwt = require('jsonwebtoken');

const SE_UPDATE_VER = 312;

const challengeUrl = `https://ota.cbx.io/api/challenge`;
const cryptogramUrl = `https://ota.cbx.io/api/cryptogram`;
const MAIN_AID = '436f6f6c57616c6c657450524f';
const BACKUP_AID = '4261636b75704170706c6574';
const CARDMANAGER_AID = 'A000000151000000';
const SSD_AID = 'A000000151535041';

/**
 * 
 * @param transport 
 * @param appletCommand 
 */
export const selectApplet = async (transport: Transport, appletCommand: string = MAIN_AID) => {
  const { statusCode } = await executeCommand(transport, commands.SELECT_APPLET, target.SE, appletCommand);
  if (statusCode === CODE._9000) {
    return { status: true, statusCode };
  }
  return { status: false, statusCode };


};

export const checkUpdate = async (transport: Transport) => {
  let cardSEVersion;
  try {
    cardSEVersion = await general.getSEVersion(transport);
  } catch (error) {
    cardSEVersion = 0
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
export const updateSE = async (transport: Transport, cardId: string, appId: string, appPrivateKey: string, progressCallback: Function, callAPI: Function, updateMCU: boolean = false) => {
  // BackupApplet
  let cardSEVersion;
  try {
    cardSEVersion = await general.getSEVersion(transport);
  } catch (e) {
    console.error(e);
    cardSEVersion = 0;

  }
  let progressIndex = 0;
  let progressNum = [14, 28, 36, 44, 50, 88, 100];

  if (updateMCU) {
    progressNum = progressNum.map(num => Math.floor(num / 2));
  }
  try {

    await display.showUpdate(transport);

    progressCallback(progressNum[progressIndex++]);
    const hasBackupScriptSEVersion = 76;
    let isAppletExist;
    // try {
    isAppletExist = await selectApplet(transport);
    // } catch (e) {
    //   console.error(e);
    //   isAppletExist = false;

    // }


    if (isAppletExist) {
      if (cardSEVersion >= hasBackupScriptSEVersion) {
        const isCardRecognized = await general.hi(transport, appId);

        let { walletCreated } = await informational.getCardInfo(transport);
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
    progressCallback(progressNum[progressIndex++]);
    console.debug(`selectBackUpSeedApplet statusCode: ${statusCode}`);


    //get ssd applet and authorize
    await selectApplet(transport, CARDMANAGER_AID);
    await selectApplet(transport, SSD_AID);
    progressCallback(progressNum[progressIndex++]);

    console.debug(`mutual Authorization Start----`);
    const challengeResponse = await callAPI(challengeUrl, getAPIOption(cardId));
    console.debug("cardID: ", cardId);
    const challengeObj = await formatAPIResponse(transport, challengeResponse);
    const cryptogramResponse = await callAPI(cryptogramUrl, getAPIOption(cardId, challengeObj.outputData));
    await formatAPIResponse(transport, cryptogramResponse);
    console.debug(`mutual Authorization Done----`);

    progressCallback(progressNum[progressIndex++]);
    await insertDeleteScript(transport, script.deleteScript);
    console.debug('Delete Card Manager Done');

    progressCallback(progressNum[progressIndex]); // progress 50 
    await insertLoadScript(transport, script.loadScript, progressCallback, progressNum[progressIndex], progressNum[progressIndex + 1]);
    console.debug('Load OTA Script Done');
    progressIndex += 1

    progressCallback(progressNum[progressIndex++]);
    await insertScript(transport, script.installScript);

    await display.hideUpdate(transport); // Hide update from the card

    await selectApplet(transport, CARDMANAGER_AID);
    isAppletExist = await selectApplet(transport);
    console.debug(`isAppletExist: ${isAppletExist}`);

    if (isAppletExist) {
      // start recover backupData
      console.debug(`Start checking recovery`);
      let isNeedRecover = await setting.checkBackupStatus(transport);
      console.debug(`isNeedRecover: ${isNeedRecover}`);
      if (isNeedRecover === true) {
        await recoverBackupData(transport);
      }
    }
    progressCallback(progressNum[progressIndex]);
    console.debug('Install OTA Script (SE Update) Done');

    return SE_UPDATE_VER;
  } catch (e) {
    try {
      await display.hideUpdate(transport)
    } catch (ex) {
      console.error('APDU.Other.finishUpdate Failed' + e);
    }
    throw new SDKError(updateSE.name, `${e}, 'SE Update Failed', '00000', 'SEUpdate'`);
  }

};


const parseOTAScript = async (OTAScript: string) => {
  const allApplet = OTAScript.split(/\n/);
  const parsedAPDU = await promise.map(allApplet, (data, i) => {
    const CLA = data.slice(0, 2);
    const INS = data.slice(2, 4);
    const P1 = data.slice(4, 6);
    const P2 = data.slice(6, 8);
    const packets = data.slice(8);

    if (CLA !== '80') throw `Problem in OTA Script in line ${i}`;
    return { CLA, INS, P1, P2, packets };
  });

  return parsedAPDU;
};

const insertScript = async (transport: Transport, scriptHex: string) => {
  try {
    let num = 1;
    const scripts = await parseOTAScript(scriptHex);
    await promise.each(scripts, async script => {
      const { CLA, INS, P1, P2, packets } = script;
      const apdu = util.assemblyCommandAndData(CLA, INS, P1, P2, packets);
      await executeAPDU(transport, apdu, target.SE);
    });
  } catch (e) {
    throw 'insert Script Failed! ' + e;
  }


};

const insertLoadScript = async (transport: Transport, scriptHex: string, progressCallback: Function, floor: number, ceil: number) => {
  try {
    const scripts = await parseOTAScript(scriptHex);
    const step = (ceil - floor) / scripts.length
    await promise.each(scripts, async (script, idx) => {
      const { CLA, INS, P1, P2, packets } = script;
      const apdu = util.assemblyCommandAndData(CLA, INS, P1, P2, packets);
      await executeAPDU(transport, apdu, target.SE);
      progressCallback(parseInt((floor + idx * step).toString()))
    });
  } catch (e) {
    throw 'Load Script Failed! ' + e;
  }
};



const insertDeleteScript = async (transport: Transport, scriptHex: string) => {
  try {
    const scripts = await parseOTAScript(scriptHex);
    await promise.each(scripts, async script => {
      const { CLA, INS, P1, P2, packets } = script;
      const apdu = util.assemblyCommandAndData(CLA, INS, P1, P2, packets);
      const { statusCode } = await executeAPDU(transport, apdu, target.SE);
      // Applet is not exits mean applet already deleted!
      const deleteStatus = (statusCode === CODE._6A88 || statusCode === CODE._9000) ? true : false;
      if (!deleteStatus) {
        throw 'Delete failed, status code: ' + statusCode;
      }
      // throw 'test error';
    });
  } catch (e) {
    throw 'Delete Script Failed! ' + e;
  }
};


const recoverBackupData = async (transport: Transport) => {
  try {
    await setting.recoverSeed(transport);
  } catch (e) {
    if (e.message) {
      console.error('[recoverBackupData] fail:', e.message);
    }
    throw 'recover Backup data failed' + e;
  }
};


const deleteBackupRegisterData = async (transport: Transport, appId: string, appPrivateKey: string) => {
  try {
    const command = commands.DELETE_REGISTER_BACKUP;
    let signedData = await auth.getCommandSignature(transport, appId, appPrivateKey, command)
    let status = await setting.deleteSeedBackup(transport, signedData);
    console.debug(`${deleteBackupRegisterData.name} status: ${status}`);
  } catch (e) {
    if (e.message) {
      console.error(`${deleteBackupRegisterData.name} fail: ${e.message}`);
    }
    throw 'backup Register data Failed ' + e;
  }
};

const backupRegisterData = async (transport: Transport, appId: string, appPrivateKey: string) => {
  try {
    const command = commands.BACKUP_REGISTER_DATA;
    let signature = await auth.getCommandSignature(transport, appId, appPrivateKey, command)
    console.debug(`backupRegisterData: ${signature}`)
    let status = await setting.backupSeed(transport, signature);
    console.debug(`${backupRegisterData.name} status: ${status}`);
  } catch (e) {
    if (e.message) {
      console.error(`${backupRegisterData.name} fail: ${e.message}`);
    }
    throw 'backup Register data Failed ' + e;
  }
};

/**
 * 
 * @param data 
 */
export const getAPIOption = (cardId: string, challengeData: string = '') => {
  const secret = 'd579bf4a2883cecf610785c49623e1';
  // let payload = new TokenSigner('ES256K', secret).sign(data)
  // console.log(`signed token ${payload}`)

  let data;
  if (challengeData === '') {
    data = { cwid: cardId };
  } else {
    data = { cryptogram: challengeData, cwid: cardId };
  }

  console.debug(data)

  let payload = jwt.sign(data, secret, { expiresIn: 60 * 60 * 24 });

  console.debug(`payload: ${payload}`);

  const body = {
    keyNum: '1',
    payload,
  };

  const options = {
    body: JSON.stringify(body),
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };

  return options;
}

export const formatAPIResponse = async (transport: Transport, result: Response) => {
  // handle response result with
  let bodyText;
  try {
    bodyText = await result.json();
  } catch (e) {
    bodyText = await result.text();
  }
  const status = result.status
  console.debug(`Server status ${status}`);
  if (status === 405) {
    console.error(`Mutaul Authentication Fail: ${status}`);
    throw `Mutaul Authentication Fail: ${status}`;
  }
  if (status !== 200) {
    let { error } = bodyText;
    let message;
    if (error && error.message) {
      message = bodyText.error.message;
    } else {
      message = bodyText;
    }
    console.error(`Server message ${JSON.stringify(message)}`);
    throw JSON.stringify(message);
  }
  const obj = jwt.decode(bodyText.cryptogram);
  console.debug(`Server Auth Response : ${JSON.stringify(obj)}`);
  const { CLA, INS, P1, P2, packets } = obj;
  const apdu = util.assemblyCommandAndData(CLA, INS, P1, P2, packets);
  const response = await executeAPDU(transport, apdu, target.SE);
  return response
}

