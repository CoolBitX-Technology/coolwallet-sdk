import { executeCommand } from './execute';
import Transport from '../transport';
import { Commands } from "./command";

/**
 * Display "UPDATE" on wallet display
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const showUpdate = async (transport: Transport): Promise<boolean> => {
  await executeCommand(transport, Commands.START_UPDATE, 'SE');
  return true;
};

/**
 * Hide "UPDATE" on card
 * @param {Transport}
 * @return {Promise<boolean>}
 */
export const hideUpdate = async (transport: Transport): Promise<boolean> => {
  await executeCommand(transport, Commands.FINISH_UPDATE, 'SE');
  return true;
};

/**
 * Upate balances shown on card display
 * @param {Transport} transport
 * @param {string} data
 * @return {Promise<boolean>}
 */
export const updateBalance = async (transport: Transport, data: string): Promise<boolean> => {
  await executeCommand(transport, Commands.UPDATE_BALANCE, 'SE', data);
  return true;
};
