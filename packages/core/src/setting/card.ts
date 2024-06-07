import { APDUError } from '../error/errorHandle';
import { commands } from '../apdu/execute/command';
import Transport from '../transport';
import { executeCommand } from '../apdu/execute/execute';
import { target } from '../config/param';
import { CODE } from '../config/status/code';

/**
 * Reset CoolWallet (clear all data)
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const resetCard = async (transport: Transport): Promise<boolean> => {
  const { statusCode, msg } = await executeCommand(transport, commands.RESET_PAIR, target.SE);
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(commands.RESET_PAIR, statusCode, msg);
  }
};
