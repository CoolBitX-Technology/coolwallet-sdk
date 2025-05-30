import { SDKError } from '../error/errorHandle';
import { sign } from '../crypto/sign';
import { CommandType } from '../apdu/execute/command';
import Transport from '../transport';
import { common, info } from '..';

/**
 * Get Command signature to append to some specific APDU commands.
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {String} command
 * @param {String} data
 * @param {String} params1
 * @param {String} params2
 * @returns {Promise<{signature: string, forceUseSC: boolean}>}
 */
export const getCommandSignature = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  command: CommandType,
  data: string = '',
  params1: string = '00',
  params2: string = '00'
): Promise<string> => {
  const nonce = await common.getNonce(transport);
  console.debug('- nonce: ', nonce);
  const P1 = params1 || command.P1;
  const P2 = params2 || command.P2;
  const apduHeader = command.CLA + command.INS + P1 + P2;
  const dataPackets = data || '';
  console.debug('- dataPackets: ', dataPackets);
  const signatureParams = apduHeader + dataPackets + nonce;
  console.debug('- signatureParams: ', signatureParams);
  const signature = sign(signatureParams, appPrivateKey).toString('hex');
  console.debug('- signature: ', signature);

  const appIdWithSignature = appId + signature.padStart(144, '0'); // Pad to 72B
  console.debug('- appIdWithSignature: ' + appIdWithSignature);
  return appIdWithSignature;
};

/**
 * check if function is supported with current SE version.
 * @param {Transport} transport
 * @param {number} requiredSEVersion
 */
export const versionCheck = async (transport: Transport, requiredSEVersion: number) => {
  const SEVersion = await info.getSEVersion(transport);
  if (SEVersion < requiredSEVersion)
    throw new SDKError(versionCheck.name, `Firmware version too low. Please update to ${requiredSEVersion}`);
};
