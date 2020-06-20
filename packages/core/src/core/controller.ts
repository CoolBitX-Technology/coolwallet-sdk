import { UnknownCommand } from '../error/index';
import * as apdu from '../apdu/index';
import Transport from '../transport';

/**
 * Check if the current SE support script execution
 * @param {Transport} transport
 * @returns {Promise<boolean>}
 */
export const checkSupportScripts = async (transport: Transport) => {
  try {
    await apdu.tx.getSignedHex(transport);
    return true;
  } catch (error) {
    if (error instanceof UnknownCommand) return false;
    return true;
  }
};
