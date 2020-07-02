import { executeCommand } from './execute/execute';
import Transport from '../transport';
import { commands } from "./execute/command";
import { target } from './config/target';
import { CODE } from './config/status/code';
import { SDKError, APDUError } from '../error/errorHandle';
/**
 * Response boolean (isCardRecognized)
 * @param {Transport} transport
 * @param {string} appId
 * @return {Promise<boolean>} isCardRecognized
 */
export const hi = async (transport: Transport, appId: string): Promise<boolean> => {
  try {
    const { statusCode } = await executeCommand(transport, commands.SAY_HI, target.SE, appId);
    return status === CODE._9000;
  } catch (error) {
    return false;
  }
}

/**
 * Get nonce from CWS
 * @param {Transport} transport
 * @return {Promise<string>}
 */
export const getNonce = async (transport: Transport): Promise<string> => {
  const { outputData: nonce } = await executeCommand(transport, commands.GET_NONCE, target.SE);
  return nonce;
};

/**
 * Get SE Version from CoolWalletS
 * @param {Transport} transport
 * @returns {Promise<Number>}
 */
export const getSEVersion = async (transport: Transport): Promise<number> => {
  const { outputData } = await executeCommand(transport, commands.GET_SE_VERSION, target.SE);
  return parseInt(outputData, 16);
};

/**
 * Reset CoolWalletS (clear all data)
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const resetCard = async (transport: Transport): Promise<boolean> => {
  const { statusCode, msg } = await executeCommand(transport, commands.RESET_PAIR, target.SE);
  if (statusCode === CODE._9000) {
    return true
  } else {
    throw new APDUError(commands.GET_NONCE, statusCode, msg)
  }
};
