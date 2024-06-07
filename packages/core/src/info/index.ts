import { executeCommand } from '../apdu/execute/execute';
import { commands } from '../apdu/execute/command';
import Transport from '../transport';

import { target } from '../config/param';
import { SE_MODE } from '../config/mode';
import { CODE } from '../config/status/code';
import { APDUError } from '../error/errorHandle';
import { MCUInfo, MCUVersion } from './types';

/**
 * Get SE Version from CoolWalletS
 * @param {Transport} transport
 * @returns {Promise<Number>}
 */
const getSEVersion = async (transport: Transport): Promise<number> => {
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
const getSEMode = async (transport: Transport): Promise<SE_MODE> => {
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
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
const getCardId = async (transport: Transport): Promise<string> => {
  const { statusCode, msg, outputData } = await executeCommand(transport, commands.GET_CARD_ID, target.SE);
  if (statusCode === CODE._9000) {
    return outputData;
  } else {
    throw new APDUError(commands.GET_CARD_ID, statusCode, msg);
  }
};

const getMCUVersion = async (transport: Transport): Promise<MCUVersion> => {
  // Data[0..2]: Command echo
  // Data[3..4]: Block Mark
  // Data[5]: Year
  // Data[6]: Month
  // Data[7]: Day
  // Data[8]: Hour
  // Data[9]: Data[0..9] XOR
  const { outputData } = await executeCommand(transport, commands.GET_MCU_VERSION, target.MCU);
  const blockMark = outputData.slice(6, 10); // 3900
  const cardMCUVersion = outputData.slice(10, 18).toUpperCase();
  return { fwStatus: blockMark, cardMCUVersion };
};

const getMCUInfo = async (transport: Transport): Promise<MCUInfo> => {
  // HW_Version[9]
  // FW_Version[17]
  // Device_ID_Length[20](Not fixed, ex. CoolWallet CWP000000)
  // HW Status[3]
  // Mode[1]
  // Battery[1]
  const { outputData } = await executeCommand(transport, commands.GET_MCU_INFO, target.MCU);
  const hardwareVersion = Buffer.from(outputData.slice(0, 18), 'hex').toString('ascii');
  const firmwareVersion = Buffer.from(outputData.slice(18, 52), 'hex').toString('ascii');
  const battery = parseInt(outputData.slice(-2), 16).toString() + '%';
  return { hardwareVersion, firmwareVersion, battery };
};

export { getSEVersion, getSEMode, getCardId, getMCUVersion, getMCUInfo };
