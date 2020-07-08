import { executeCommand } from './execute/execute';
import Transport from '../transport';
import { commands } from "./execute/command";
import { target } from '../config/target';
import { CODE } from '../config/status/code';
import { SDKError, APDUError } from '../error/errorHandle';



/**
 * Get basic card information
 * @param {Transport} transport
 */
export const getCardInfo = async (transport: Transport): Promise<string> => {
  const { outputData, statusCode, msg } = await executeCommand(transport, commands.GET_CARD_INFO, target.SE);
  if (outputData) {
    return outputData;
  } else {
    throw new APDUError(commands.GET_CARD_INFO, statusCode, msg)
  }
};

/**
 * Update last used keyId to store in CWS.
 * @param {Transport} transport
 * @param {string} data
 * @param {string} P1
 */
export const updateKeyId = async (transport: Transport, data: string, P1: string) => {
  const { statusCode, msg } = await executeCommand(transport, commands.UPDATE_KEYID, target.SE, data, P1);
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.UPDATE_KEYID, statusCode, msg)
  }
};

/**
 * Fetch last used keyId from CWS
 * @param {Transport} transport
 * @param {string} P1
 */
export const getLastKeyId = async (transport: Transport, P1: string) => {
  const { outputData, statusCode, msg } = await executeCommand(transport, commands.GET_KEYID, target.SE, undefined, P1);
  if (outputData) {
    return outputData;
  } else {
    throw new APDUError(commands.GET_KEYID, statusCode, msg)
  }
};



/**
 *
 * @param {Transport} transport
 * @param {string} signature
 * @param {string} detailFlag 00 if want to show detail, 01 otherwise
 */
export const toggleDisplayAddress = async (transport: Transport, signature: string, detailFlag: string) => {
  const { statusCode, msg } = await executeCommand(transport, commands.SHOW_FULL_ADDRESS, target.SE, signature, detailFlag);
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.SHOW_FULL_ADDRESS, statusCode, msg)
  }
};

