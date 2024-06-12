import { APDUError } from '../error/errorHandle';
import { commands } from '../apdu/execute/command';
import Transport from '../transport';
import { executeCommand } from '../apdu/execute/execute';
import { target } from '../config/param';
import { CODE } from '../config/status/code';
import { getCommandSignature } from './auth';
import { getCardInfo } from '../info';
import { error } from '..';
import { auth } from '.';

/**
 * Reset CoolWallet (clear all data)
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
 * Update last used keyId to store in CoolWallet.
 * @param {Transport} transport
 * @param {Array<{KeyId: string, coinType: string}>} dataArr
 * @param {string} P1
 */
export const updateKeyId = async (
  transport: Transport,
  appId: string,
  appPrivKey: string,
  dataArr: Array<{ KeyId: string; coinType: string }>,
  P1 = '00'
) => {
  const indexIdDataArr = dataArr.map((data) => {
    if (!data.KeyId) {
      const defaultAddressIndex = '0000';
      return data.coinType + defaultAddressIndex;
    } else {
      return data.coinType + data.KeyId;
    }
  });

  const lengthOfData = indexIdDataArr.length;
  const indexIdData = indexIdDataArr.join('');
  P1 = lengthOfData.toString(16).padStart(2, '0');

  const signature = await getCommandSignature(transport, appId, appPrivKey, commands.UPDATE_KEYID, indexIdData, P1);

  const executeCommandDdata = indexIdData + signature;
  const { statusCode, msg } = await executeCommand(
    transport,
    commands.UPDATE_KEYID,
    target.SE,
    executeCommandDdata,
    P1,
    undefined
  );
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.UPDATE_KEYID, statusCode, msg);
  }
};

/**
 * Fetch last used keyId from CoolWallet
 * @param {Transport} transport
 * @param {string} P1
 */
export const getLastKeyId = async (transport: Transport, P1: string) => {
  const { outputData, statusCode, msg } = await executeCommand(transport, commands.GET_KEYID, target.SE, undefined, P1);
  if (outputData) {
    const coinArray = outputData.match(/.{6}/g);
    if (coinArray) {
      const result = coinArray.map((coin) => {
        const coinType = coin.slice(0, 2);
        const addressLastIndex = coin.slice(2);

        return { coinType, addressLastIndex };
      });

      return result;
    } else {
      throw new APDUError(commands.GET_KEYID, '', 'coinArray is null in method getLastKeyId');
    }
  } else {
    throw new APDUError(commands.GET_KEYID, statusCode, msg);
  }
};

/**
 *
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appId
 * @param {string} appPrivKey
 * @param {boolean} showDetail
 */
export const toggleDisplayAddress = async (
  transport: Transport,
  appId: string,
  appPrivKey: string,
  showDetailFlag: boolean
) => {
  if (transport.cardType === 'Lite') {
    throw new error.SDKError(executeCommand.name, `CoolWallet LITE does not support MCU command.`);
  }
  const { showDetail } = await getCardInfo(transport);
  const detailFlag = showDetailFlag ? '00' : '01';
  if (showDetail === showDetailFlag) {
    return showDetailFlag;
  }

  const signature = await getCommandSignature(
    transport,
    appId,
    appPrivKey,
    commands.CHANGE_DISPLAY_TYPE,
    '',
    detailFlag
  );

  const { statusCode, msg } = await executeCommand(
    transport,
    commands.CHANGE_DISPLAY_TYPE,
    target.SE,
    signature,
    detailFlag,
    undefined
  );
  if (statusCode === CODE._6A86) {
    const showDetailStatus = showDetailFlag ? 'open' : 'close';
    throw new APDUError(
      commands.CHANGE_DISPLAY_TYPE,
      statusCode,
      `SHOW_FULL_ADDRESS is ${showDetailStatus}, please change showDetailFlag for ${!showDetailFlag} `
    );
  } else if (statusCode === CODE._9000) {
    return showDetailFlag;
  } else {
    throw new APDUError(commands.CHANGE_DISPLAY_TYPE, statusCode, msg);
  }
};

/**
 * Toggle Lock card (01 to lock, 00 to unluch)
 * @param {Transport} transport
 * @param {string} appId
 * * @param {string} appPrivKey
 * @param {boolean} freezePair
 */
export const switchLockStatus = async (
  transport: Transport,
  appId: string,
  appPrivKey: string,
  freezePair: boolean
) => {
  const pairLockStatus = freezePair ? '01' : '00';
  const signature = await auth.getCommandSignature(
    transport,
    appId,
    appPrivKey,
    commands.CHANGE_PAIR_STATUS,
    '',
    pairLockStatus
  );

  const { statusCode, msg } = await executeCommand(
    transport,
    commands.CHANGE_PAIR_STATUS,
    target.SE,
    signature,
    pairLockStatus,
    undefined
  );
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.CHANGE_PAIR_STATUS, statusCode, msg);
  }
};
