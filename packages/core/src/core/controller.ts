import { UnknownCommand } from '../error/index';
import * as apdu from '../apdu/index';
import Transport from '../transport';
import * as tx from '../transaction/index'

/**
 * Check if the current SE support script execution
 * @param {Transport} transport
 * @returns {Promise<boolean>}
 */
export const checkSupportScripts = async (transport: Transport) => {
  try {
    await tx.getSignedHex(transport);
    return true;
  } catch (error) {
    if (error instanceof UnknownCommand) return false;
    return true;
  }
};
