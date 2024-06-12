import Transport from '../transport';
import { target } from '../config/param';
import { APDUError, SDKError } from '../error/errorHandle';
import { executeCommand } from '../apdu/execute/execute';
import { commands } from '../apdu/execute/command';
import { CODE } from '../config/status/code';

/**
 * Cancel last APDU
 * @param {Transport} transport
 */
export const cancelAPDU = async (transport: Transport) => {
  const { statusCode, msg } = await executeCommand(transport, commands.CANCEL_APDU, target.MCU);
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.CANCEL_APDU, statusCode, msg);
  }
};

/**
 * Power off SE
 * @param {Transport}
 * @return {Promise<boolean>}
 */
export const powerOff = async (transport: Transport): Promise<boolean> => {
  try {
    await executeCommand(transport, commands.PWR_OFF, target.MCU);
    return true;
  } catch (e) {
    throw new SDKError(powerOff.name, 'powerOff error');
  }
};
