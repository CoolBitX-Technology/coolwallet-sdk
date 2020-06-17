import { FirmwareVersionTooLow } from '../error/index';
import { COMMAND } from '../config/command';
import { sign } from '../crypto/sign';
import { control, setting } from '../apdu/index';
import { checkSupportScripts } from './controller';
import Transport from '../transport';

/**
 * Get Command signature to append to some specific APDU commands.
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {String} commandName
 * @param {String} data
 * @param {String} params1
 * @param {String} params2
 * @returns {Promise<{signature: string, forceUseSC: boolean}>}
 */
export const getCommandSignature = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  commandName: string,
  data: string | undefined,
  params1: string | undefined,
  params2: string | undefined = undefined,
  isCreateWallet: boolean = false
) => {
  const nonce = await control.getNonce(transport);

  const forceUseSC = await checkSupportScripts(transport);

  const commandParams = COMMAND[commandName];
  const P1 = params1 || commandParams.P1;
  const P2 = params2 || commandParams.P2;
  const apduHeader = commandParams.CLA + commandParams.INS + P1 + P2;
  const dataPackets = data || '';
  const signatureParams = apduHeader + dataPackets + nonce;
  const signature = sign(signatureParams, appPrivateKey).toString('hex');

  if (!forceUseSC) {
    await control.sayHi(transport, appId);
    return { signature, forceUseSC };
  } // return [appId(20B)] [rightJustifiedSignature(72B)]

  // v200 create wallet by card can not Secure Channel so forceUseSC = false
  // v200 signature = [apduData(Variety)][appId(20B)[rightJustifiedSignature(72B)]
  const appIdWithSignature = appId + signature.padStart(144, '0'); // Pad to 72B
  if (isCreateWallet) {
    return { signature: appIdWithSignature, forceUseSC: false };
  }

  // Return AppId with padded signature: Dont need to call [say hi].
  // the following operaion is forced to used Secure Channel
  // const appIdWithSignature = appId + signature.padStart(144, '0'); // Pad to 72B
  return { signature: appIdWithSignature, forceUseSC };
};

/**
 * check if function is supported with current SE version.
 * @param {Transport} transport
 * @param {number} requiredSEVersion
 * @return {Promise<void>}
 */
export const versionCheck = async (transport: Transport, requiredSEVersion: number) => {
  const SEVersion = await setting.getSEVersion(transport);
  if (SEVersion < requiredSEVersion) throw new FirmwareVersionTooLow(requiredSEVersion);
};
