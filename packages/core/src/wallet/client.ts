import { commands } from '../apdu/execute/command';
import { executeCommand } from '../apdu/execute/execute';
import { target } from '../config/param';
import { CODE } from '../config/status/code';
import { APDUError, SDKError } from '../error/errorHandle';
import Transport, { CardType } from '../transport';
import * as crypto from '../crypto/index';
import { mcu } from '..';
import { getCommandSignature } from '../setting/auth';

// changePairPwd (0x12) is supported from Pro SE 348 and Go SE 102.
const PRO_CHANGE_PAIR_PWD_SE_VERSION = 348;
const GO_CHANGE_PAIR_PWD_SE_VERSION = 102;

/**
 * @param {Transport} transport
 * @param {string} appPublicKey
 * @param {String} password
 * @param {String} deviceName
 * @returns {Promise}
 */
export const register = async (
  transport: Transport,
  appPublicKey: string,
  password: string,
  deviceName: string,
  SEPublicKey: string
): Promise<string> => {
  if (!SEPublicKey) {
    throw new SDKError(register.name, 'SEPublicKey can not be undifined');
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
  if (password.length % 2 === 1 && password.length > 8) {
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
  const {
    statusCode,
    outputData: appId,
    msg,
  } = await executeCommand(transport, commands.REGISTER, target.SE, data, P1);
  if (statusCode === CODE._9000) {
    return appId;
  } else {
    throw new APDUError(commands.REGISTER, statusCode, msg);
  }
};

/**
 * Change the pairing password. Needs Pro SE 348 or Go SE 102.
 * Only a wrong old password uses up one of the tries shared with register.
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivKey
 * @param {string} oldPassword 6-8 digits on Pro, 8 digits on Go
 * @param {string} newPassword 6-8 digits on Pro, 8 digits on Go
 * @param {string} SEPublicKey
 */
export const changePairingPassword = async (
  transport: Transport,
  appId: string,
  appPrivKey: string,
  oldPassword: string,
  newPassword: string,
  SEPublicKey: string
): Promise<void> => {
  if (!SEPublicKey) {
    throw new SDKError(changePairingPassword.name, 'SEPublicKey can not be undifined');
  }
  // The card does not check the password length, so the SDK enforces it: Pro takes 6-8 digits and Go exactly 8.
  // The old password was set under the same rule, so any other old password can never match.
  const isGo = transport.cardType === CardType.Go;
  const passwordPattern = isGo ? /^\d{8}$/ : /^\d{6,8}$/;
  const passwordDigits = isGo ? '8' : '6-8';
  if (!passwordPattern.test(oldPassword)) {
    throw new SDKError(changePairingPassword.name, `oldPassword must be ${passwordDigits} digits`);
  }
  if (!passwordPattern.test(newPassword)) {
    throw new SDKError(changePairingPassword.name, `newPassword must be ${passwordDigits} digits`);
  }
  // Like isSigningOnlyFirmware, a failed version query throws instead of reading as version 0,
  // so a transport error is never reported as old firmware.
  const requiredSEVersion =
    transport.cardType === CardType.Go ? GO_CHANGE_PAIR_PWD_SE_VERSION : PRO_CHANGE_PAIR_PWD_SE_VERSION;
  const version = await executeCommand(transport, commands.GET_SE_VERSION, target.SE);
  if (version.statusCode !== CODE._9000 || !version.outputData) {
    throw new APDUError(commands.GET_SE_VERSION, version.statusCode, version.msg);
  }
  const seVersion = parseInt(version.outputData, 16);
  if (!Number.isNaN(seVersion)) transport.seVersion = seVersion;
  if (!(seVersion >= requiredSEVersion)) {
    throw new SDKError(
      changePairingPassword.name,
      `Firmware version too low. Please update to ${requiredSEVersion}`
    );
  }

  // Passwords are BCD left-padded with F to 4 bytes, as in register.
  const passwords = oldPassword.padStart(8, 'F') + newPassword.padStart(8, 'F');
  const encryptedPasswords = crypto.encryption.ECIESenc(SEPublicKey, passwords);
  const signature = await getCommandSignature(
    transport,
    appId,
    appPrivKey,
    commands.CHANGE_PAIR_PWD,
    encryptedPasswords
  );
  const { statusCode, msg } = await executeCommand(
    transport,
    commands.CHANGE_PAIR_PWD,
    target.SE,
    encryptedPasswords + signature,
    undefined,
    undefined
  );
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.CHANGE_PAIR_PWD, statusCode, msg);
  }
};

/**
 *
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivKey
 * @return {Promise<Array<{appId:string, deviceName:string}>>}
 */
export const getPairedApps = async (
  transport: Transport,
  appId: string,
  appPrivKey: string
): Promise<Array<{ appId: string; deviceName: string }>> => {
  const signature = await getCommandSignature(transport, appId, appPrivKey, commands.GET_PAIRED_DEVICES);
  const { outputData } = await executeCommand(
    transport,
    commands.GET_PAIRED_DEVICES,
    target.SE,
    signature,
    undefined,
    undefined
  );
  const appsInfo = outputData.match(/.{100}/g);
  if (!appsInfo) {
    throw new SDKError(getPairedApps.name, 'appsInfo is undefined');
  }
  const apps = appsInfo.map((appInfo) => {
    appId = appInfo.slice(0, 40);
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
  const signature = await getCommandSignature(transport, appId, appPrivKey, commands.GET_PAIR_PWD);
  const { outputData: encryptedPassword } = await executeCommand(
    transport,
    commands.GET_PAIR_PWD,
    target.SE,
    signature,
    undefined,
    undefined
  );

  // const encryptedPassword = await apdu.pairing.getPairingPassword(transport, signature, forceUseSC);
  // Go has no MCU, and the card has already replaced the password, so a throwing powerOff would lose it.
  if (transport.cardType === CardType.Pro) await mcu.control.powerOff(transport);
  let password = crypto.encryption.ECIESDec(appPrivKey, encryptedPassword);
  if (!password) throw new SDKError(getPairingPassword.name, `password error, your password: ${password}`);
  password = password.replace(/f/gi, '');
  return password;
};

/**
 * Remove Paired device by id
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {string} pairedAppId
 */
export const removePairedDevice = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  pairedAppId: string
) => {
  if (appId !== pairedAppId) {
    const signature = await getCommandSignature(transport, appId, appPrivateKey, commands.REMOVE_DEVICES, pairedAppId);
    const appIdWithSig = pairedAppId + signature;
    const { statusCode, msg } = await executeCommand(
      transport,
      commands.REMOVE_DEVICES,
      target.SE,
      appIdWithSig,
      undefined,
      undefined
    );
    if (statusCode !== CODE._9000) {
      throw new APDUError(commands.REMOVE_DEVICES, statusCode, msg);
    }
  } else {
    throw new SDKError(removePairedDevice.name, `pairedAppId should not equal appId`);
  }
};

/**
 * Rename current device
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivKey
 * @param {string} newDeviceName
 */
export const renameDevice = async (transport: Transport, appId: string, appPrivKey: string, newDeviceName: string) => {
  try {
    let nameToUTF = Buffer.from(newDeviceName);
    if (nameToUTF.length < 30) {
      const diff = 30 - nameToUTF.length;
      const temp = Buffer.allocUnsafe(diff);
      temp.fill(0);
      nameToUTF = Buffer.concat([temp, nameToUTF]);
    }
    const name = nameToUTF.toString('hex');
    const signature = await getCommandSignature(transport, appId, appPrivKey, commands.RENAME_DEVICES, name);
    const renameParams = name + signature;

    const { statusCode, msg } = await executeCommand(
      transport,
      commands.RENAME_DEVICES,
      target.SE,
      renameParams,
      undefined,
      undefined
    );

    if (statusCode !== CODE._9000) {
      throw new APDUError(commands.RENAME_DEVICES, statusCode, msg);
    }
  } catch (e) {
    throw new SDKError(renameDevice.name, 'SDK RenamePairedDevice failed');
  }
};
