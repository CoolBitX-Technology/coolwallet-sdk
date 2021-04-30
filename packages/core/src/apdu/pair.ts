import { executeCommand } from './execute/execute';
import Transport from '../transport';
import { commands } from "./execute/command";
import { target } from '../config/param';
import { CODE } from '../config/status/code';
import { SDKError, APDUError } from '../error/errorHandle';
import { getCommandSignature } from "../setting/auth";
import * as core from '../setting/index';
import * as crypto from '../crypto/index';
import * as config from '../config/index';
import * as apdu from '../apdu/index';

/**
 * Toggle Lock card (01 to lock, 00 to unluch)
 * @param {Transport} transport
 * @param {string} signature data
 * @param {string} lock 01 to lock your card
 */
export const switchLockStatus = async (transport: Transport, appId: string, appPrivKey: string, freezePair: boolean) => {
  const pairLockStatus = freezePair ? '01' : '00';
  const signature = await core.auth.getCommandSignature(
    transport,
    appId,
    appPrivKey,
    commands.CHANGE_PAIR_STATUS,
    '',
    pairLockStatus
  );

  const { statusCode, msg } = await executeCommand(transport, commands.CHANGE_PAIR_STATUS, target.SE, signature, pairLockStatus, undefined);
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.CHANGE_PAIR_STATUS, statusCode, msg)
  }
};


/**
 * @param {Transport} transport
 * @param {string} appPublicKey
 * @param {String} password
 * @param {String} deviceName
 * @returns {Promise}
 */
export const register = async (transport: Transport, appPublicKey: string, password: string, deviceName: string, SEPublicKey: string): Promise<string> => {
  if (!SEPublicKey) {
    throw new SDKError(register.name, 'SEPublicKey can not be undifined')
  }
  let nameToUTF = Buffer.from(deviceName, 'utf8');
  const maxLen = 30;

  if (nameToUTF.length < maxLen) {
    const diff = maxLen - nameToUTF.length;
    const temp = Buffer.allocUnsafe(diff);
    temp.fill(0);
    nameToUTF = Buffer.concat([temp, nameToUTF]);
  } else {
    nameToUTF = nameToUTF.slice(0, maxLen);
  }
  if (password.length % 2 == 1 && password.length > 8) {
    password = '0' + password;
  }
  const addedPassword = password.padStart(8, 'F');

  const hexNameToUTF = nameToUTF.toString('hex');
  let data = addedPassword + appPublicKey + hexNameToUTF;
  let P1 = '00';

  const supportEncryptedRegister = true;
  if (supportEncryptedRegister) {
    data = crypto.encryption.ECIESenc(SEPublicKey, data);
    P1 = '01';
  }
  const { statusCode, outputData: appId, msg } = await executeCommand(transport, commands.REGISTER, target.SE, data, P1);
  if (statusCode === CODE._9000) {
    return appId;
  } else {
    throw new APDUError(commands.REMOVE_DEVICES, statusCode, msg)
  }

};

/**
 *
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivKey
 * @return {Promise<Array<{appId:string, deviceName:string}>>}
 */
export const getPairedApps = async (transport: Transport, appId: string, appPrivKey: string): Promise<Array<{ appId: string, deviceName: string }>> => {
  const signature = await core.auth.getCommandSignature(
    transport,
    appId,
    appPrivKey,
    commands.GET_PAIRED_DEVICES
  );
  const { outputData } = await executeCommand(
    transport,
    commands.GET_PAIRED_DEVICES,
    target.SE,
    signature, undefined, undefined
  );
  const appsInfo = outputData.match(/.{100}/g);
  if (!appsInfo) {
    throw new SDKError(getPairedApps.name, 'appsInfo is undefined')
  }
  const apps = appsInfo.map((appInfo) => {
    const appId = appInfo.slice(0, 40);
    const deviceName = Buffer.from(appInfo.slice(40), 'hex')
      .toString()
      // eslint-disable-next-line no-control-regex
      .replace(/\u0000/gi, '');
    return { appId, deviceName };
  });
  return apps;
};

/**
 * Get Pairing password for current device
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivKey
 * @return {Promise<string>}
 */
export const getPairingPassword = async (transport: Transport, appId: string, appPrivKey: string): Promise<string> => {
  const signature = await core.auth.getCommandSignature(
    transport,
    appId,
    appPrivKey,
    commands.GET_PAIR_PWD
  );
  const { outputData: encryptedPassword } = await executeCommand(transport, commands.GET_PAIR_PWD, target.SE, signature, undefined, undefined);

  // const encryptedPassword = await apdu.pairing.getPairingPassword(transport, signature, forceUseSC);
  await apdu.mcu.control.powerOff(transport);
  let password = crypto.encryption.ECIESDec(appPrivKey, encryptedPassword);
  if (!password) throw new SDKError(getPairingPassword.name, `password error, your password: ${password}`)
  password = password.replace(/f/gi, '');
  return password;
};

/**
 * Remove Paired device by id
 * @param {Transport} transport
 * @param {string} appIdWithSig
 */
export const removePairedDevice = async (transport: Transport, appId: string, appPrivateKey: string, pairedAppId: string) => {
  if (appId !== pairedAppId) {
    const signature = await getCommandSignature(
      transport,
      appId,
      appPrivateKey,
      commands.REMOVE_DEVICES,
      pairedAppId
    );
    const appIdWithSig = pairedAppId + signature
    const { statusCode, msg } = await executeCommand(transport, commands.REMOVE_DEVICES, target.SE, appIdWithSig, undefined, undefined);
    if (statusCode !== CODE._9000) {
      throw new APDUError(commands.REMOVE_DEVICES, statusCode, msg)
    }
  } else {
    throw new SDKError(removePairedDevice.name, `pairedAppId should not equal appId`)
  }


};

/**
 * Rename current device
 * @param {Transport} transport
 * @param {string} nameWithSig
 */
export const renameDevice = async (transport: Transport, appId: string, appPrivKey: string, newDeviceName: string) => {
  try {
    let nameToUTF = Buffer.from(newDeviceName);
    if (nameToUTF.length < 30) {
      let diff = 30 - nameToUTF.length;
      let temp = Buffer.allocUnsafe(diff);
      temp.fill(0);
      nameToUTF = Buffer.concat([temp, nameToUTF]);
    }
    const name = nameToUTF.toString('hex');
    const signature = await core.auth.getCommandSignature(
      transport,
      appId,
      appPrivKey,
      commands.RENAME_DEVICES,
      name
    );
    const renameParams = name + signature;

    const { statusCode, msg } = await executeCommand(transport, commands.RENAME_DEVICES, target.SE, renameParams, undefined, undefined);

    if (statusCode !== CODE._9000) {
      throw new APDUError(commands.RENAME_DEVICES, statusCode, msg);
    }
  } catch (e) {
    throw new SDKError(renameDevice.name, 'SDK RenamePairedDevice failed');
  }


};
