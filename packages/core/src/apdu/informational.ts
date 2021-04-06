import { executeCommand } from './execute/execute';
import Transport from '../transport';
import { commands } from "./execute/command";
import { target } from '../config/param';
import { CODE } from '../config/status/code';
import { APDUError, SDKError } from '../error/errorHandle';
import { getCommandSignature } from "../setting/auth";



/**
 * Get basic card information
 * @param {Transport} transport
 */
export const getCardInfo = async (transport: Transport): Promise<{ paired: boolean; locked: boolean; walletCreated: boolean; showDetail: boolean; pairRemainTimes: number; accountDigest: string;}> => {

  try{
    const { outputData, statusCode, msg } = await executeCommand(transport, commands.GET_CARD_INFO, target.SE);
    const databuf = Buffer.from(outputData, 'hex');
    const pairStatus = databuf.slice(0, 1).toString('hex');
    const lockedStatus = databuf.slice(1, 2).toString('hex');
    const pairRemainTimes = parseInt(databuf.slice(2, 3).toString('hex'), 16);
    const walletStatus = databuf.slice(3, 4).toString('hex');
    const accountDigest = databuf.slice(4, 9).toString('hex');
    const displayType = databuf.slice(9).toString('hex');

    if (accountDigest === '81c69f2d90' || accountDigest === '3d84ba58bf' || accountDigest === '83ccf4aab1') {
      throw new APDUError(commands.GET_CARD_INFO, statusCode, msg);
    }

    const paired = pairStatus === '01';
    const locked = lockedStatus === '01';
    const walletCreated = walletStatus === '01';
    const showDetail = displayType === '00';

    return {
      paired,
      locked,
      walletCreated,
      showDetail,
      pairRemainTimes,
      accountDigest
    };
  
  } catch (e) {
    throw new SDKError(getCardInfo.name, 'Bad Firmware statusCode. Please reset your CoolWalletS.');
  }
};

/**
 * Update last used keyId to store in CWS.
 * @param {Transport} transport
 * @param {Array<{KeyId: string, coinType: string}>} dataArr
 * @param {string} P1
 */
export const updateKeyId = async (transport: Transport, appId: string, appPrivKey: string, dataArr: Array<{ KeyId: string, coinType: string }>, P1: string = "00") => {

  let indexIdDataArr = dataArr.map(data => {
    if (!data.KeyId) {
      const defaultAddressIndex = '0000';
      return data.coinType + defaultAddressIndex;
    }
    else {
      return data.coinType + data.KeyId;
    }
  })

  const lengthOfData = indexIdDataArr.length;
  const indexIdData = indexIdDataArr.join('');
  P1 = lengthOfData.toString(16).padStart(2, '0');

  const signature = await getCommandSignature(
    transport,
    appId,
    appPrivKey,
    commands.UPDATE_KEYID,
    indexIdData,
    P1
  )

  const executeCommandDdata = indexIdData + signature;
  const { statusCode, msg } = await executeCommand(transport, commands.UPDATE_KEYID, target.SE, executeCommandDdata, P1, undefined);
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
    const coinArray = outputData.match(/.{6}/g);
    if (coinArray) {

      const result = coinArray.map((coinArray) => {
        const coinType = coinArray.slice(0, 2);
        const addressLastIndex = coinArray.slice(2);

        return { coinType, addressLastIndex };
      });

      return result;
    } else {
      throw new APDUError(commands.GET_KEYID, '', "coinArray is null in method getLastKeyId")  
    }
  } else {
    throw new APDUError(commands.GET_KEYID, statusCode, msg)
  }
};



/**
 *
 * @param {Transport} transport
 * @param {string} signature
 * @param {boolean} detailFlag 00 if want to show detail, 01 otherwise
 */
export const toggleDisplayAddress = async (transport: Transport, appId: string, appPrivKey: string, showDetailFlag: boolean) => {
  let { showDetail } = await getCardInfo(transport);
  const detailFlag = showDetailFlag ? '00' : '01';
  if (showDetail === showDetailFlag) {
    return showDetailFlag;
  }

  const signature  = await getCommandSignature(
    transport,
    appId,
    appPrivKey,
    commands.SHOW_FULL_ADDRESS,
    '',
    detailFlag
  )


  const { statusCode, msg } = await executeCommand(transport, commands.SHOW_FULL_ADDRESS, target.SE, signature, detailFlag, undefined);
  if (statusCode === CODE._6A86) {
    const showDetailStatus = showDetailFlag ? "open" : "close";
    throw new APDUError(commands.SHOW_FULL_ADDRESS, statusCode, `SHOW_FULL_ADDRESS is ${showDetailStatus}, please change showDetailFlag for ${!showDetailFlag} `)
  } else if (statusCode === CODE._9000) {
    return showDetailFlag
  } else {
    throw new APDUError(commands.SHOW_FULL_ADDRESS, statusCode, msg)
  } 
};

