import { executeCommand } from './execute';
import { RESPONSE } from '../config/response';
/**
 * Pair current device with CWS card
 * @param {string} data
 * @param {string} P1
 * @return {Promise<string>} appId
 */
export const registerDevice = async (transport, data, P1) => {
  const { outputData: appId } = await executeCommand(transport, 'REGISTER', 'SE', data, P1);
  return appId;
};

/**
 * get ENCRYPTED pairing password
 * @param {Transport} transport
 * @param {string} data
 * @return {Promise<string>}
 */
export const getPairingPassword = async (transport, data, forceUseSC) => {
  const { outputData } = await executeCommand(transport, 'GET_PAIR_PWD', 'SE', data, null, null, true, forceUseSC);
  return outputData;
};

/**
 * Get list of paired devices
 * @param {Transport} transport
 * @param {string} signature
 * @param {bool} forceUseSC
 * @return {Promise<Array<{appId:string, appName: string}>>}
 */
export const getPairedApps = async (transport, signature, forceUseSC) => {
  const { outputData } = await executeCommand(
    transport,
    'GET_PAIRED_DEVICES',
    'SE',
    signature, null, null,
    true, forceUseSC
  );
  const appsInfo = outputData.match(/.{100}/g);
  const apps = appsInfo.map((appInfo) => {
    const appId = appInfo.slice(0, 40);
    const appName = Buffer.from(appInfo.slice(40), 'hex')
      .toString()
      // eslint-disable-next-line no-control-regex
      .replace(/\u0000/gi, '');
    return { appId, appName };
  });
  return apps;
};

/**
 * Remove Paired device by id
 * @param {Transport} transport
 * @param {string} appIdWithSig
 * @return {Promise<boolean>}
 */
export const removePairedDevice = async (transport, appIdWithSig) => {
  const { status } = await executeCommand(transport, 'REMOVE_DEVICES', 'SE', appIdWithSig);
  return status === RESPONSE.SUCCESS;
};

/**
 * Rename current device
 * @param {Transport} transport
 * @param {string} nameWithSig
 * @return {Promise<boolean>}
 */
export const renameDevice = async (transport, nameWithSig) => {
  const { status } = await executeCommand(transport, 'RENAME_DEVICES', 'SE', nameWithSig);
  return status === RESPONSE.SUCCESS;
};
