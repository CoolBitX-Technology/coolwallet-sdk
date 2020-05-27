import { UnknownCommand } from '@coolwallets/errors';
import * as apdu from '../apdu/index';

/**
 * Check if the current SE support script execution
 * @param {Transport} transport
 * @returns {Promise<boolean>}
 */
export const checkSupportScripts = async (transport) => {
  try {
    await apdu.tx.getSignedHex(transport);
    return true;
  } catch (error) {
    if (error instanceof UnknownCommand) return false;
    return true;
  }
};
