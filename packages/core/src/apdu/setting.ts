import { executeCommand } from './execute';
import { RESPONSE } from '../config/response';
import Transport from '../transport';

/**
 * Reset CoolWalletS (clear all data)
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const resetCard = async (transport: Transport): Promise<boolean> => {
  const { status } = await executeCommand(transport, 'RESET_PAIR', 'SE');
  return status === RESPONSE.SUCCESS;
};

/**
 * Get basic card information
 * @param {Transport} transport
 */
export const getCardInfo = async (transport: Transport): Promise<string> => {
  const { outputData } = await executeCommand(transport, 'GET_CARD_INFO', 'SE');
  return outputData;
};

/**
 * Update last used keyId to store in CWS.
 * @param {Transport} transport
 * @param {string} data
 * @param {string} P1
 * @return {Promise<boolean>}
 */
export const updateKeyId = async (transport: Transport, data: string, P1: string): Promise<boolean> => {
  await executeCommand(transport, 'UPDATE_KEYID', 'SE', data, P1);
  return true;
};

/**
 * Fetch last used keyId from CWS
 * @param {Transport} transport
 * @param {string} P1
 */
export const getLastKeyId = async (transport: Transport, P1: string) => {
  const { outputData } = await executeCommand(transport, 'GET_KEYID', 'SE', undefined, P1);
  return outputData;
};

/**
 * Toggle Lock card (01 to lock, 00 to unluch)
 * @param {Transport} transport
 * @param {string} signature data
 * @param {string} lock 01 to lock your card
 * @return {Promise<boolean>}
 */
export const switchLockStatus = async (transport: Transport, signature: string, lock: string): Promise<boolean> => {
  await executeCommand(transport, 'CHANGE_PAIR_STATUS', 'SE', signature, lock);
  return true;
};

/**
 *
 * @param {Transport} transport
 * @param {string} signature
 * @param {string} detailFlag 00 if want to show detail, 01 otherwise
 * @return {Promise<boolean>}
 */
export const toggleDisplayAddress = async (transport: Transport, signature: string, detailFlag: string): Promise<boolean> => {
  await executeCommand(transport, 'SHOW_FULL_ADDRESS', 'SE', signature, detailFlag);
  return true;
};

/**
 * Get SE Version from CoolWalletS
 * @param {Transport} transport
 * @returns {Promise<Number>}
 */
export const getSEVersion = async (transport: Transport): Promise<number> => {
  const { outputData } = await executeCommand(transport, 'GET_SE_VERSION', 'SE');
  return parseInt(outputData, 16);
};
