import { Promise as promise } from 'bluebird';
import * as core from '@coolwallet/core';
import { cwp, cws } from '../config/otaScript';
import { commands } from '../config/commends';

var jwt = require('jsonwebtoken');

const challengeUrl = `https://ota.cbx.io/api/challenge`;
const cryptogramUrl = `https://ota.cbx.io/api/cryptogram`;
const CARDMANAGER_AID = 'A000000151000000';
const SSD_AID = 'A000000151535041';

const target = {
  SE:'SE', 
  MCU:'MCU'
}

/**
 * 
 * @param transport 
 * @param cardId ex: CWS0123456
 * @param appId 
 * @param appPrivateKey 
 * @param progressCallback progressCallback(progressNum): return update progress percentage
 * @param stateCallback
 * @param callAPI callAPI(url, options): Function of calling api
 * @param isPro
 * @param version
 */
export const update = async (otaKey, transport, cardId, appId, appPrivateKey, progressCallback, stateCallback, callAPI, isPro, version) => {

	const MAIN_AID = isPro ? '436f6f6c57616c6c657450524f' : 'c1c2c3c4c5';
	const BACKUP_AID = isPro ? '4261636b75704170706c6574' : 'a1a2a3a4a5a6';
	const ota = isPro ? cwp : cws;
	const deleteScript = ota.deleteScript;
	const installScript = ota.installScript;
	const loadScript = ota.loadScripts[version];

  let progressIndex = 0;
  let progressNum = [14, 28, 36, 44, 50, 88, 100];
  let progressState = ["backup seed", "select SSD", "authorize", "delete applet", "load cap", "install applet", "done"];

  try {

    await core.apdu.mcu.display.showUpdate(transport);

		// 14. backup seed
    stateCallback(progressState[progressIndex]);
		progressCallback(progressNum[progressIndex++]);
    const { status: isAppletExist } = await core.apdu.ota.selectApplet(transport, MAIN_AID);
    await core.apdu.ota.selectApplet(transport, CARDMANAGER_AID);
    const { status: isBackupAppletExist } = await core.apdu.ota.selectApplet(transport, BACKUP_AID);
    console.debug(`isAppletExist: ${isAppletExist}`);
    console.debug(`isBackupAppletExist: ${isBackupAppletExist}`);

		if (isAppletExist && isBackupAppletExist) {
			const isCardRecognized = await core.apdu.general.hi(transport, appId);
			console.log('isCardRecognized :', isCardRecognized);
      let { walletCreated } = await core.apdu.info.getCardInfo(transport);
			console.log('walletCreated :', walletCreated);
      console.debug(`isCardRecognized: ${isCardRecognized}, walletStatus: ${walletCreated}`);
      if (isCardRecognized) {
        await deleteBackupRegisterData(transport, appId, appPrivateKey);
        if (walletCreated) {
          await backupRegisterData(transport, appId, appPrivateKey);
        }
      }
    }

    // 28. select SSD
    stateCallback(progressState[progressIndex]);
		progressCallback(progressNum[progressIndex++]);
    await core.apdu.ota.selectApplet(transport, CARDMANAGER_AID);
    await core.apdu.ota.selectApplet(transport, SSD_AID);

		// 36. authorize
    stateCallback(progressState[progressIndex]);
		progressCallback(progressNum[progressIndex++]);
    const challengeResponse = await callAPI(challengeUrl, getAPIOption(otaKey, cardId));
    console.debug("cardID: ", cardId);
    const challengeObj = await formatAPIResponse(transport, challengeResponse);
    const cryptogramResponse = await callAPI(cryptogramUrl, getAPIOption(otaKey, cardId, challengeObj.outputData));
    await formatAPIResponse(transport, cryptogramResponse);
    console.debug(`mutual Authorization Done----`);

		// 44. delete applet
    stateCallback(progressState[progressIndex]);
		progressCallback(progressNum[progressIndex++]);
    await insertDeleteScript(transport, deleteScript);
    console.debug('Delete Card Manager Done');

		if (!version) {
    	stateCallback("done");
			progressCallback(100);
			return;
		}

		// 50. load cap
    stateCallback(progressState[progressIndex]);
    progressCallback(progressNum[progressIndex]);
    await insertLoadScript(transport, loadScript, progressCallback, progressNum[progressIndex], progressNum[progressIndex + 1]);
    console.debug('Load OTA Script Done');
    progressIndex += 1

		// 88. install applet
    stateCallback(progressState[progressIndex]);
		progressCallback(progressNum[progressIndex++]);
    await insertScript(transport, installScript);

    await core.apdu.mcu.display.hideUpdate(transport); // Hide update from the card

    await core.apdu.ota.selectApplet(transport, CARDMANAGER_AID);
    const { status: updateSuccess } = await core.apdu.ota.selectApplet(transport, MAIN_AID);
    console.debug(`updateSuccess: ${updateSuccess}`);

		if (updateSuccess && isBackupAppletExist) {
      // start recover backupData
      console.debug(`Start checking recovery`);
      let isNeedRecover = await core.apdu.setting.checkBackupStatus(transport);
      console.debug(`isNeedRecover: ${isNeedRecover}`);
      if (isNeedRecover === true) {
        await recoverBackupData(transport);
      }
    }

		// 100. done
    stateCallback(progressState[progressIndex]);
		progressCallback(progressNum[progressIndex]);

  } catch (e) {
    try {
      await core.apdu.mcu.display.hideUpdate(transport)
    } catch (ex) {
      console.error('APDU.Other.finishUpdate Failed' + e);
    }
  }

};


const parseOTAScript = async (OTAScript) => {
  const allApplet = OTAScript.split(/\n/);
  const parsedAPDU = await promise.map(allApplet, (data, i) => {
    const CLA = data.slice(0, 2);
    const INS = data.slice(2, 4);
    const P1 = data.slice(4, 6);
    const P2 = data.slice(6, 8);
    const packets = data.slice(8);

    if (CLA !== '80') console.error(`Problem in OTA Script in line ${i}`);
    return { CLA, INS, P1, P2, packets };
  });

  return parsedAPDU;
};

const insertScript = async (transport, scriptHex) => {
  try {
    const scripts = await parseOTAScript(scriptHex);
    await promise.each(scripts, async script => {
      const { CLA, INS, P1, P2, packets } = script;
      const apdu = core.utils.assemblyCommandAndData(CLA, INS, P1, P2, packets);
      await core.apdu.execute.executeAPDU(transport, apdu, target.SE);
    });
  } catch (e) {
    console.error('insert Script Failed! ' + e);
  }


};

const insertLoadScript = async (transport, scriptHex, progressCallback, floor, ceil) => {
  try {
    const scripts = await parseOTAScript(scriptHex);
    const step = (ceil - floor) / scripts.length
    await promise.each(scripts, async (script, idx) => {
      const { CLA, INS, P1, P2, packets } = script;
      const apdu = core.utils.assemblyCommandAndData(CLA, INS, P1, P2, packets);
      await core.apdu.execute.executeAPDU(transport, apdu, target.SE);
      progressCallback(parseInt((floor + idx * step).toString()))
    });
  } catch (e) {
    console.error('Load Script Failed! ' + e);
  }
};



const insertDeleteScript = async (transport, scriptHex) => {
  try {
    const scripts = await parseOTAScript(scriptHex);
    await promise.each(scripts, async script => {
      const { CLA, INS, P1, P2, packets } = script;
      const apdu = core.utils.assemblyCommandAndData(CLA, INS, P1, P2, packets);
      const { statusCode } = await core.apdu.execute.executeAPDU(transport, apdu, target.SE);
      // Applet is not exits mean applet already deleted!
      const deleteStatus = (statusCode === '6A88' || statusCode === '9000') ? true : false;
      if (!deleteStatus) {
        console.error('Delete failed, status code: ' + statusCode);
      }
    });
  } catch (e) {
    console.error('Delete Script Failed! ' + e);
  }
};


const recoverBackupData = async (transport) => {
  try {
    await core.apdu.setting.recoverSeed(transport);
  } catch (e) {
    if (e.message) {
      console.error('[recoverBackupData] fail:', e.message);
    }
  }
};


const deleteBackupRegisterData = async (transport, appId, appPrivateKey) => {
  try {
    const command = commands.DELETE_REGISTER_BACKUP;
    let signedData = await core.setting.auth.getCommandSignature(transport, appId, appPrivateKey, command)
    let status = await core.apdu.setting.deleteSeedBackup(transport, signedData);
    console.debug(`${deleteBackupRegisterData.name} status: ${status}`);
  } catch (e) {
    if (e.message) {
      console.error(`${deleteBackupRegisterData.name} fail: ${e.message}`);
    }
  }
};

const backupRegisterData = async (transport, appId, appPrivateKey) => {
  try {
    const command = commands.BACKUP_REGISTER_DATA;
    let signature = await core.setting.auth.getCommandSignature(transport, appId, appPrivateKey, command)
    console.debug(`backupRegisterData: ${signature}`)
    let status = await core.apdu.setting.backupSeed(transport, signature);
    console.debug(`${backupRegisterData.name} status: ${status}`);
  } catch (e) {
    if (e.message) {
      console.error(`${backupRegisterData.name} fail: ${e.message}`);
    }
  }
};

/**
 * 
 * @param data 
 */
export const getAPIOption = (secret, cardId, challengeData = '') => {

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

export const formatAPIResponse = async (transport, result) => {
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
  }
  const obj = jwt.decode(bodyText.cryptogram);
  console.debug(`Server Auth Response : ${JSON.stringify(obj)}`);
  const { CLA, INS, P1, P2, packets } = obj;
  const apdu = core.utils.assemblyCommandAndData(CLA, INS, P1, P2, packets);
  const response = await core.apdu.execute.executeAPDU(transport, apdu, target.SE);
  return response
}

