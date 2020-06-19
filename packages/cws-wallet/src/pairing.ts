import {
  apdu, crypto, config, core, transport, error
} from '@coolwallet/core';
type Transport = transport.default;


/**
 * @param {Transport} transport
 * @param {string} appPublicKey
 * @param {String} password
 * @param {String} deviceName
 * @returns {Promise}
 */
export const register = async (transport: Transport, appPublicKey: string, password: string, deviceName: string): Promise<String> => {
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
  const addedPassword = password.padStart(8, 'F');

  const hexNameToUTF = nameToUTF.toString('hex');
  let data = addedPassword + appPublicKey + hexNameToUTF;
  let P1 = '00';

  const supportEncryptedRegister = true;
  if (supportEncryptedRegister) {
    data = crypto.encryption.ECIESenc(config.KEY.SEPublicKey, data);
    P1 = '01';
  }
  const appId = await apdu.pairing.registerDevice(transport, data, P1);
  return appId;
};

/**
 *
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivKey
 * @return {Promise<Array<{appId:string, }>>}
 */
export const getPairedApps = async (transport: Transport, appId: string, appPrivKey: string): Promise<Array<{ appId: string; }>> => {
  const { signature, forceUseSC } = await core.auth.getCommandSignature(
    transport,
    appId,
    appPrivKey,
    'GET_PAIRED_DEVICES',
    undefined,
    undefined
  );
  const apps = await apdu.pairing.getPairedApps(transport, signature, forceUseSC);
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
  const { signature, forceUseSC } = await core.auth.getCommandSignature(
    transport,
    appId,
    appPrivKey,
    'GET_PAIR_PWD',
    undefined,
    undefined
  );
  const encryptedPassword = await apdu.pairing.getPairingPassword(transport, signature, forceUseSC);
  await apdu.control.powerOff(transport);
  let password = crypto.encryption.ECIESDec(appPrivKey, encryptedPassword);
  if (!password) throw new error.SDKError('getPairingPassword error', 'password is undefined')
  password = password.replace(/f/gi, '');
  return password;
};
