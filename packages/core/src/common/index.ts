import { executeCommand } from '../apdu/execute/execute';
import { commands } from '../apdu/execute/command';
import Transport from '../transport';
import { target } from '../config/param';
import { CODE } from '../config/status/code';
import { APDUError } from '../error/errorHandle';

/**
 * @param {Transport} transport
 * @param {string} data
 * @return {Promise<string>}
 */
export const echo = async (transport: Transport, data: string): Promise<string> => {
  console.log('data :', data);
  const { outputData, statusCode, msg } = await executeCommand(transport, commands.ECHO, target.SE, data);
  if (statusCode === CODE._9000) {
    return outputData;
  } else {
    throw new APDUError(commands.ECHO, statusCode, msg);
  }
};

/**
 * Response boolean (isCardRecognized)
 * @param {Transport} transport
 * @param {string} appId
 * @return {Promise<boolean>} isCardRecognized
 */
export const hi = async (transport: Transport, appId: string): Promise<boolean> => {
  try {
    const { statusCode } = await executeCommand(transport, commands.SAY_HI, target.SE, appId);
    return statusCode === CODE._9000;
  } catch (error) {
    return false;
  }
};

/**
 * Get nonce from CoolWallet
 * @param {Transport} transport
 * @return {Promise<string>}
 */
export const getNonce = async (transport: Transport): Promise<string> => {
  const { outputData: nonce, statusCode, msg } = await executeCommand(transport, commands.GET_NONCE, target.SE);
  if (statusCode === CODE._9000) {
    return nonce;
  } else {
    throw new APDUError(commands.GET_NONCE, statusCode, msg);
  }
};
