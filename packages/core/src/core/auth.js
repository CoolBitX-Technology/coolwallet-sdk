import { FirmwareVersionTooLow } from '@coolwallets/errors';
import COMMAND from '../config/command';
import { sign } from '../crypto/sign';
import { control, setting } from '../apdu/index';
import { checkSupportScripts } from './txUtil';

/**
 * Get Command signature to append to some specific APDU commands.
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {String} commandName
 * @param {String} data
 * @param {String} params1
 * @param {String} params2
 * @returns {Promise<string>}
 */
export const generalAuthorization = async (
  transport,
  appId,
  appPrivateKey,
  commandName,
  data,
  params1,
  params2
) => {
  const useScript = await checkSupportScripts(transport);
  if (useScript) {
    await control.sayHi(transport, appId);
    // To do: Implement secure channel signature.
    return '';
  }
  const dataPackets = data || '';
  const nonce = await control.getNonce(transport);

  const commandParams = COMMAND[commandName];
  const P1 = params1 || commandParams.P1;
  const P2 = params2 || commandParams.P2;
  const command = commandParams.CLA + commandParams.INS + P1 + P2;
  const signatureParams = command + dataPackets + nonce;
  const signature = sign(signatureParams, appPrivateKey).toString('hex');
  await control.sayHi(transport, appId);
  return signature;
};

/**
 * check if function is supported with current SE version.
 * @param {Transport} transport
 * @param {number} requiredSEVersion
 * @return {Promise<void>}
 */
export const versionCheck = async (transport, requiredSEVersion) => {
  const SEVersion = await setting.getSEVersion(transport);
  if (SEVersion < requiredSEVersion) throw new FirmwareVersionTooLow(requiredSEVersion);
};
