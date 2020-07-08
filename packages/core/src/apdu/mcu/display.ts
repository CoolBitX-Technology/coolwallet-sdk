import { executeCommand } from '../execute/execute';
import Transport from '../../transport';
import { commands } from "../execute/command";
import { target } from '../../config/target';
import { CODE } from '../../config/status/code';
import { SDKError, APDUError } from '../../error/errorHandle';

/**
 * Display "UPDATE" on wallet display
 * @param {Transport} transport
 */
export const showUpdate = async (transport: Transport) => {
  const {statusCode, msg} = await executeCommand(transport, commands.START_UPDATE, target.MCU);
  if (statusCode !== CODE._9000){
    throw new APDUError(commands.START_UPDATE, statusCode, msg)
  }
};

/**
 * Hide "UPDATE" on card
 * @param {Transport}
 */
export const hideUpdate = async (transport: Transport) => {
  const { statusCode, msg } = await executeCommand(transport, commands.FINISH_UPDATE, target.MCU);
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.FINISH_UPDATE, statusCode, msg)
  }
};

/**
 * Upate balances shown on card display
 * @param {Transport} transport
 * @param {string} data
 */
export const updateBalance = async (transport: Transport, data: string) => {
  const { statusCode, msg } = await executeCommand(transport, commands.UPDATE_BALANCE, target.MCU, data);
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.UPDATE_BALANCE, statusCode, msg)
  }
};
