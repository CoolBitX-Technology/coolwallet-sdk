import { executeCommand } from './execute/execute';
import Transport from '../transport';
import { commands } from './execute/command';
import { target } from '../config/param';
import { SE_MODE } from '../config/mode';
import { CODE } from '../config/status/code';
import { APDUError } from '../error/errorHandle';

/**
 * @param {Transport} transport
 * @param {string} data
 * @return {Promise<string>}
 */
export const echo = async (transport: Transport, data: string): Promise<string> => {
  console.log('data :', data);
  const { outputData, statusCode, msg } = await executeCommand(transport, commands.ECHO, target.SE, data);
  if (statusCode === CODE._9000) {
    return outputData;
  } else {
    throw new APDUError(commands.ECHO, statusCode, msg);
  }
};

/**
 * Response boolean (isCardRecognized)
 * @param {Transport} transport
 * @param {string} appId
 * @return {Promise<boolean>} isCardRecognized
 */
export const hi = async (transport: Transport, appId: string): Promise<boolean> => {
  try {
    const { statusCode } = await executeCommand(transport, commands.SAY_HI, target.SE, appId);
    return statusCode === CODE._9000;
  } catch (error) {
    return false;
  }
};

/**
 * Get nonce from CWS
 * @param {Transport} transport
 * @return {Promise<string>}
 */
export const getNonce = async (transport: Transport): Promise<string> => {
  const { outputData: nonce, statusCode, msg } = await executeCommand(transport, commands.GET_NONCE, target.SE);
  if (statusCode === CODE._9000) {
    return nonce;
  } else {
    throw new APDUError(commands.GET_NONCE, statusCode, msg);
  }
};

/**
 * Get SE Version from CoolWalletS
 * @param {Transport} transport
 * @returns {Promise<Number>}
 */
export const getSEVersion = async (transport: Transport): Promise<number> => {
  try {
    const { outputData, statusCode, msg } = await executeCommand(transport, commands.GET_SE_VERSION, target.SE);
    if (outputData) {
      return parseInt(outputData, 16);
    } else {
      throw new APDUError(commands.GET_SE_VERSION, statusCode, msg);
    }
  } catch (e) {
    return 0;
  }
};

/**
 * Get SE Mode from CoolWalletS
 * @param {Transport} transport
 * @returns {Promise<Number>}
 */
export const getSEMode = async (transport: Transport): Promise<SE_MODE> => {
  const { outputData } = await executeCommand(transport, commands.GET_SE_MODE, target.SE);
  const isFactory = outputData.slice(0, 2);
  const isDevelop = outputData.slice(2, 4);
  if (isFactory === '01') {
    return SE_MODE.FACTORY;
  }
  if (isDevelop === '01') {
    return SE_MODE.DEVELOP;
  }

  return SE_MODE.PRODUCTION;
};

/**
 * Reset CoolWalletS (clear all data)
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

/**
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const getCardId = async (transport: Transport): Promise<string> => {
  const { statusCode, msg, outputData } = await executeCommand(transport, commands.GET_CARD_ID, target.SE);
  if (statusCode === CODE._9000) {
    return outputData;
  } else {
    throw new APDUError(commands.GET_CARD_ID, statusCode, msg);
  }
};
