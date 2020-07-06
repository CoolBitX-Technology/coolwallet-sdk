import { CommandType, commands } from './command';
import * as util from '../../utils';
import { SHA256 } from '../../crypto/hash';
import Transport from '../../transport/index';
import { SDKError, APDUError } from '../../error/errorHandle';
import { CODE } from '../../config/status/code';
import { target } from '../../config/target';


/**
 * @param {string} commandName
 * @param {Transport} transport
 * @param {{command:string, data:string}} apdu
 * @param {string} commandType SE or MCU
 */
const executeAPDU = async (
  commandName: string,
  transport: Transport,
  apdu: { command: string, data: string },
  executedTarget: string
): Promise<{
  statusCode: string,
  msg: string, 
  outputData: string
}> => {
  if (typeof transport.request !== 'function') {
    throw new SDKError(executeAPDU.name, `Transport not specified or no connection established.`);
  }
  console.debug("{")
  console.debug(" command: " + apdu.command)
  console.debug(" data: " + apdu.data)
  console.debug("}")

  try{
    // TODO app transport
    if (transport.requestAPDUV2) {
      return await transport.requestAPDUV2(apdu);
    }
    let msg = ''
    const response = await transport.request(apdu.command, apdu.data);
    if (executedTarget === target.SE) {
      const statusCode = response.slice(-4);
      const outputData = response.slice(0, -4);
      msg = util.getReturnMsg(statusCode)
      return { statusCode, msg, outputData };
    } else {
      const statusCode = response.slice(4, 6);
      const outputData = response.slice(6);
      msg = util.getReturnMsg(statusCode)
      return { statusCode, msg, outputData };
    }

  } catch (error){
    throw new SDKError(executeAPDU.name, `executeAPDU error: ${error}`);
  }
};

/**
 *
 * @param {Transport} transport
 * @param {string} commandName
 * @param {string} commandType
 * @param {string} data
 * @param {string} params1
 * @param {string} params2
 * @param {bool} supportSC
 * @param {bool} forceUseSC
 * @returns {Promise<{statusCode: string, outputData: string}>}
 */
export const executeCommand = async (
  transport: Transport,
  command: CommandType,
  executedTarget: string = target.SE,
  data: string = '',
  params1: string | undefined = undefined,
  params2: string | undefined = undefined,
  supportSC: boolean = false,
  forceUseSC: boolean = false,
): Promise<{ statusCode: string, msg: string, outputData: string }> => {
  const P1 = params1 || command.P1;
  const P2 = params2 || command.P2;

  if ((typeof (P1) == undefined) || (typeof (P2) == undefined)) {
    throw new SDKError('Unknown', command.toString())
  }

  let response;
  // data too long: divide and send with SECURE CHANNEL
  if (forceUseSC || (supportSC && data.length > 500)) {
    const apduHeader = command.CLA + command.INS + P1 + P2;
    response = await sendWithSecureChannel(transport, apduHeader, data, forceUseSC);
  } else {
    const apdu = util.assemblyCommandAndData(command.CLA, command.INS, P1, P2, data);
    // eslint-disable-next-line no-console
    console.debug(`Execute Command: ${command}`);
    response = await executeAPDU(command.toString(), transport, apdu, executedTarget);
  }
  return response;

};


/**
 * Send apdu with secure channel
 * @param {Transport} transport
 * @param {string} apduHeader apdu CLS+INS+P1+P2
 * @param {string} apduData apdu data field
 */
export const sendWithSecureChannel = async (transport: Transport, apduHeader: string, apduData: string, forceUseSC: boolean): Promise<{ statusCode: string, msg: string, outputData: string }> => {
  //todo
  const salt = '88888888';
  const dataToHash = apduHeader.concat(salt, apduData);
  const hash = SHA256(dataToHash).toString('hex');
  const packedData = apduHeader.concat(hash, salt, apduData);
  console.debug("Before Secure channel: " + packedData)
  const channelVersion = '01';
  const useSecure = '00';
  const useSign = forceUseSC ? '01' : '00';
  // cipherData = [channelVersion(1B)] [useSecure(1B)] [useSign(1B)] [packedData(Variety)]
  const cypherData = channelVersion.concat(useSecure, useSign, packedData);

  // Devide cypher data and send with 250 bytes each command
  const chunks = cypherData.match(/.{1,500}/g);

  if (!chunks) {
    throw new SDKError(sendWithSecureChannel.name, 'chunks is undifined');
  }
  const totalPackages = chunks.length;

  // Send Data
  let result;
  for (let i = 0; i < totalPackages; i++) {
    // eslint-disable-next-line no-await-in-loop
    result = await sendFragment(transport, chunks[i], i, totalPackages);
  }
  if (result) {
    const statusCode = result.statusCode
    // Uncaught error in SC_SEND_SEGMENT command. Return to parent executeCommand
    if (statusCode !== CODE._9000) {
      return result;
    } else {
      const confirmHash = result.outputData.slice(4, 68);
      const confirmSalt = result.outputData.slice(68, 76);
      const apduReturn = result.outputData.slice(76);

      if (confirmSalt !== salt) {
        throw new SDKError(sendWithSecureChannel.name, 'SC: Returned salt check failed');
      }

      const returnedDataHash = SHA256(confirmSalt + apduReturn).toString('hex');
      if (returnedDataHash !== confirmHash) {
        throw new SDKError(sendWithSecureChannel.name, 'SC: Returned hash check failed');
      }

      return { statusCode: statusCode, msg: util.getReturnMsg(statusCode), outputData: apduReturn };
    }
  } else {
    throw new SDKError(sendWithSecureChannel.name, 'sendWithSecureChannel failed')
  }

};

/**
 * Send devided command with secure channel's apdu.
 * @param {Transport} transport
 * @param {string} data
 * @param {number} index
 * @param {number} totalPackages
 */
const sendFragment = async (transport: Transport, data: string, index: number, totalPackages: number): Promise<{ statusCode: string, msg: string, outputData: string }> => {
  const P1 = index.toString(16).padStart(2, '0');
  const P2 = totalPackages.toString(16).padStart(2, '0');
  return executeCommand(transport, commands.SC_SEND_SEGMENT, target.SE, data, P1, P2, false);
};
