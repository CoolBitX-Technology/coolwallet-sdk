import Transport, { CardType } from '../transport';
import { target } from '../config/param';
import * as error from '../error';
import { executeCommand } from '../apdu/execute/execute';
import { commands } from '../apdu/execute/command';
import { CODE } from '../config/status/code';

/**
 * Cancel last APDU
 * @param {Transport} transport
 */
export const cancelAPDU = async (transport: Transport) => {
  if (transport.cardType === CardType.Lite) {
    throw new error.SDKError(cancelAPDU.name, `CoolWallet LITE does not support this command.`);
  }
  const { statusCode, msg } = await executeCommand(transport, commands.CANCEL_APDU, target.MCU);
  if (statusCode !== CODE._9000) {
    throw new error.APDUError(commands.CANCEL_APDU, statusCode, msg);
  }
};

/**
 * Power off SE
 * @param {Transport}
 * @return {Promise<boolean>}
 */
export const powerOff = async (transport: Transport): Promise<boolean> => {
  if (transport.cardType === CardType.Lite) {
    throw new error.SDKError(powerOff.name, `CoolWallet LITE does not support this command.`);
  }
  try {
    await executeCommand(transport, commands.PWR_OFF, target.MCU);
    return true;
  } catch (e) {
    throw new error.SDKError(powerOff.name, 'powerOff error');
  }
};
