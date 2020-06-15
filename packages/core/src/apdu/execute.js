import { OperationCanceled, NoTransport } from '../error/index';
import COMMAND from '../config/command';
import { assemblyCommandAndData, throwSDKError, SDKUnknownWithCode } from './utils';
import { RESPONSE, DFU_RESPONSE } from '../config/response';
import { SHA256 } from '../crypto/hash';


/**
 * @param {string} commandName
 * @param {Transport} transport
 * @param {{command:string, data:string}} apdu
 * @param {string} commandType SE or MCU
 */
const executeAPDU = async (commandName, transport, apdu, commandType) => {
  if (typeof transport.request !== 'function') throw new NoTransport();
  const response = await transport.request(apdu.command, apdu.data);
  if (commandType === 'SE') {
    const status = response.slice(-4);
    const outputData = response.slice(0, -4);
    return { status, outputData };
  }
  const status = response.slice(4, 6);
  const outputData = response.slice(6);
  if (status !== DFU_RESPONSE.SUCCESS) throw SDKUnknownWithCode(commandName, status);
  return { status, outputData };
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
  transport, commandName, commandType = 'SE', data, params1, params2,
  supportSC = false,
  forceUseSC = false,
) => {
  const commandParams = COMMAND[commandName];

  const P1 = params1 || commandParams.P1;
  const P2 = params2 || commandParams.P2;

  let response;

  // data too long: divide and send with SECURE CHANNEL
  if (forceUseSC || (supportSC && data.length > 500)) {
    const apduHeader = commandParams.CLA + commandParams.INS + P1 + P2;
    response = await sendWithSecureChannel(transport, apduHeader, data, forceUseSC);
  } else {
    const apdu = assemblyCommandAndData(commandParams.CLA, commandParams.INS, P1, P2, data);

    // eslint-disable-next-line no-console
    console.debug(`Execute Command: ${commandName}`);
    response = await executeAPDU(commandName, transport, apdu, commandType);
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
      throwSDKError(commandName, response.status);

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
export const sendWithSecureChannel = async (transport, apduHeader, apduData, forceUseSC) => {
  const salt = '88888888';
  const dataToHash = apduHeader.concat(salt, apduData);
  const hash = SHA256(dataToHash).toString('hex');
  const packedData = apduHeader.concat(hash, salt, apduData);

  const channelVersion = '01';
  const useSecure = '00';
  const useSign = forceUseSC ? '01' : '00';

  const cypherData = channelVersion.concat(useSecure, useSign, packedData);

  // Devide cypher data and send with 250 bytes each command
  const chunks = cypherData.match(/.{1,500}/g);
  const totalPackages = chunks.length;

  // Send Data
  let result;
  for (let i = 0; i < totalPackages; i++) {
    // eslint-disable-next-line no-await-in-loop
    result = await sendFragment(transport, chunks[i], i, totalPackages);
  }
  // Uncaught error in SC_SEND_SEGMENT command. Return to parent executeCommand
  if (result.status !== RESPONSE.SUCCESS) return result;

  const confirmHash = result.outputData.slice(4, 68);
  const confirmSalt = result.outputData.slice(68, 76);
  const apduReturn = result.outputData.slice(76);
  if (confirmSalt !== salt) throw new Error('SC: Returned salt check failed');
  const returnedDataHash = SHA256(confirmSalt + apduReturn).toString('hex');
  if (returnedDataHash !== confirmHash) throw new Error('SC: Returned hash check failed');

  return { outputData: apduReturn, status: RESPONSE.SUCCESS };
};

/**
 * Send devided command with secure channel's apdu.
 * @param {Transport} transport
 * @param {string} data
 * @param {number} index
 * @param {number} totalPackages
 */
const sendFragment = async (transport, data, index, totalPackages) => {
  const P1 = index.toString(16).padStart(2, '0');
  const P2 = totalPackages.toString(16).padStart(2, '0');
  return executeCommand(transport, 'SC_SEND_SEGMENT', 'SE', data, P1, P2, false);
};
