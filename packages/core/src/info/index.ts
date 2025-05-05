import { executeCommand } from '../apdu/execute/execute';
import { commands } from '../apdu/execute/command';
import Transport from '../transport';
import { target } from '../config/param';
import { SE_MODE } from '../config/mode';
import { CODE } from '../config/status/code';
import { APDUError, SDKError } from '../error/errorHandle';
import { MCUInfo, MCUVersion } from './types';
import isNil from 'lodash/isNil';
import set from 'lodash/set';

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

export const getMCUVersion = async (transport: Transport): Promise<MCUVersion> => {
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

export const getMCUInfo = async (transport: Transport): Promise<MCUInfo> => {
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

/**
 * Get basic card information
 * @param {Transport} transport
 */
export const getCardInfo = async (
  transport: Transport
): Promise<{
  paired: boolean;
  locked: boolean;
  walletCreated: boolean;
  showDetail: boolean;
  pairRemainTimes: number;
  accountDigest: string;
  accountDigest20?: string;
  cardanoSeed?: string;
}> => {
  try {
    const { outputData, statusCode, msg } = await executeCommand(transport, commands.GET_CARD_INFO, target.SE);
    const databuf = Buffer.from(outputData, 'hex');
    const pairStatus = databuf.slice(0, 1).toString('hex');
    const lockedStatus = databuf.slice(1, 2).toString('hex');
    const pairRemainTimes = parseInt(databuf.slice(2, 3).toString('hex'), 16);
    const walletStatus = databuf.slice(3, 4).toString('hex');
    const accountDigest = databuf.slice(4, 9).toString('hex');
    const displayType = databuf.slice(9, 10).toString('hex');
    let bipEd25519IsInit;
    if (databuf.length >= 11) {
      bipEd25519IsInit = databuf.slice(10, 11).toString('hex');
    }
    let accountDigest20;
    if (databuf.length > 11) {
      accountDigest20 = databuf.slice(11, 31).toString('hex');
    }

    if (accountDigest === '81c69f2d90' || accountDigest === '3d84ba58bf' || accountDigest === '83ccf4aab1') {
      throw new APDUError(commands.GET_CARD_INFO, statusCode, msg);
    }

    const paired = pairStatus === '01';
    const locked = lockedStatus === '01';
    const walletCreated = walletStatus === '01';
    const showDetail = displayType === '00';
    const result = {
      paired,
      locked,
      walletCreated,
      showDetail,
      pairRemainTimes,
      accountDigest,
    };
    if (!isNil(bipEd25519IsInit)) set(result, 'cardanoSeed', bipEd25519IsInit === '01');
    if (!isNil(accountDigest20)) set(result, 'accountDigest20', accountDigest20);

    return result;
  } catch (e) {
    throw new SDKError(getCardInfo.name, 'Bad Firmware statusCode. Please reset your CoolWallet.');
  }
};
