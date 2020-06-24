import { OperationCanceled, NoTransport } from '../error/index';
import { CommandType, Commands } from './command';
import { assemblyCommandAndData, throwSDKError, SDKUnknownWithCode } from './utils';
import { error as Errors } from '../index';
import { RESPONSE, DFU_RESPONSE } from '../config/response';
import { SHA256 } from '../crypto/hash';
import Transport from '../transport/index';


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
  status: string,
  outputData: string
}> => {
  if (typeof transport.request !== 'function') throw new NoTransport();
  console.log("{")
  console.log(" command: " + apdu.command)
  console.log(" data: " + apdu.data)
  console.log("}")
  // TODO app transport
  if (transport.requestAPDUV2) {
    return await transport.requestAPDUV2(apdu);
  }
  const response = await transport.request(apdu.command, apdu.data);
  if (executedTarget === 'SE') {
    const status = response.slice(-4);
    const outputData = response.slice(0, -4);
    return { status, outputData };
  } else {
    const status = response.slice(4, 6);
    const outputData = response.slice(6);
    if (status !== DFU_RESPONSE.SUCCESS) {
      throw SDKUnknownWithCode(commandName, status);
    }
    return { status, outputData };
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
 * @returns {Promise<{status: string, outputData: string}>}
 */
export const executeCommand = async (
  transport: Transport,
  command: CommandType,
  executedTarget: string = 'SE',
  data: string = '',
  params1: string | undefined = undefined,
  params2: string | undefined = undefined,
  supportSC: boolean = false,
  forceUseSC: boolean = false,
): Promise<{ status: string, outputData: string }> => {
  const P1 = params1 || command.P1;
  const P2 = params2 || command.P2;

  if ((typeof (P1) == undefined) || (typeof (P2) == undefined)) {
    throw new Errors.SDKError('Unknown', command.toString())
  }

  let response;
  // data too long: divide and send with SECURE CHANNEL
  if (forceUseSC || (supportSC && data.length > 500)) {
    const apduHeader = command.CLA + command.INS + P1 + P2;
    response = await sendWithSecureChannel(transport, apduHeader, data, forceUseSC);
  } else {
    const apdu = assemblyCommandAndData(command.CLA, command.INS, P1, P2, data);
    // eslint-disable-next-line no-console
    console.debug(`Execute Command: ${command}`);
    response = await executeAPDU(command.toString(), transport, apdu, executedTarget);
  }

  switch (response.status) {
    case RESPONSE.SUCCESS: {
      return response;
    }
    case RESPONSE.CANCELED: {
      throw new OperationCanceled();
    }
    default: {
      // In case of error
      throwSDKError(command.toString(), response.status);

      // Only command that would reach here: SC_SEND_SEGMENT
      // Secure channel encounter command error: return status and outputdata
      return response;
    }
  }
};


/**
 * Send apdu with secure channel
 * @param {Transport} transport
 * @param {string} apduHeader apdu CLS+INS+P1+P2
 * @param {string} apduData apdu data field
 */
export const sendWithSecureChannel = async (transport: Transport, apduHeader: string, apduData: string, forceUseSC: boolean): Promise<{ status: string, outputData: string }> => {
  //todo
  const salt = '88888888';
  const dataToHash = apduHeader.concat(salt, apduData);
  const hash = SHA256(dataToHash).toString('hex');
  const packedData = apduHeader.concat(hash, salt, apduData);
  console.log("Before Secure channel: " + packedData)
  const channelVersion = '01';
  const useSecure = '00';
  const useSign = forceUseSC ? '01' : '00';
  // cipherData = [channelVersion(1B)] [useSecure(1B)] [useSign(1B)] [packedData(Variety)]
  const cypherData = channelVersion.concat(useSecure, useSign, packedData);

  // Devide cypher data and send with 250 bytes each command
  const chunks = cypherData.match(/.{1,500}/g);

  if (!chunks) {
    throw new Error('chunks is undifined');
  }
  const totalPackages = chunks.length;

  // Send Data
  let result;
  for (let i = 0; i < totalPackages; i++) {
    // eslint-disable-next-line no-await-in-loop
    result = await sendFragment(transport, chunks[i], i, totalPackages);
  }
  if (result) {
    // Uncaught error in SC_SEND_SEGMENT command. Return to parent executeCommand
    if (result.status !== RESPONSE.SUCCESS) {
      return result;
    } else {
      const confirmHash = result.outputData.slice(4, 68);
      const confirmSalt = result.outputData.slice(68, 76);
      const apduReturn = result.outputData.slice(76);
      if (confirmSalt !== salt) {
        throw new Error('SC: Returned salt check failed');
      }
      const returnedDataHash = SHA256(confirmSalt + apduReturn).toString('hex');
      if (returnedDataHash !== confirmHash) {
        throw new Error('SC: Returned hash check failed');
      }
      return { outputData: apduReturn, status: RESPONSE.SUCCESS };
    }
  } else {
    throw new Error('sendWithSecureChannel failed')
  }

};

/**
 * Send devided command with secure channel's apdu.
 * @param {Transport} transport
 * @param {string} data
 * @param {number} index
 * @param {number} totalPackages
 */
const sendFragment = async (transport: Transport, data: string, index: number, totalPackages: number): Promise<{ status: string, outputData: string }> => {
  const P1 = index.toString(16).padStart(2, '0');
  const P2 = totalPackages.toString(16).padStart(2, '0');
  return executeCommand(transport, Commands.SC_SEND_SEGMENT, 'SE', data, P1, P2, false);
};
