import { executeCommand } from '../execute/execute';
import Transport from '../../transport';
import { commands } from "../execute/command";
import { target } from '../../config/param';
import { CODE } from '../../config/status/code';
import { SDKError, APDUError } from '../../error/errorHandle';
import { getCommandSignature, getCommandSignatureWithoutNonce } from "../../setting/auth";

/**
 * Display "UPDATE" on wallet display
 * @param {Transport} transport
 */
export const showUpdate = async (transport: Transport) => {
  const {statusCode, msg} = await executeCommand(transport, commands.START_UPDATE, target.SE); // TODO 
  if (statusCode !== CODE._9000){
    throw new APDUError(commands.START_UPDATE, statusCode, msg)
  }
};

/**
 * Hide "UPDATE" on card
 * @param {Transport}
 */
export const hideUpdate = async (transport: Transport) => {
  const { statusCode, msg } = await executeCommand(transport, commands.FINISH_UPDATE, target.SE);
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.FINISH_UPDATE, statusCode, msg)
  }
};

export const formatBalance = function (balance: number, defaultValue = '0.0') {
  let result;
  if (isNaN(balance) || balance === null) {
    result = defaultValue;
  } else {
    if (balance < 0) {
      result = defaultValue;
    } else {
      let strVal = balance.toString();
      let splitVal = strVal.split('.');
      result = splitVal.length > 1 ? strVal : strVal + '.0';
    }
  }
  return result;
};


/**
 * Upate balances shown on card display
 * coinTypes => BTC: 00, ETH: 3C, LTC: 02, XRP: 90];
 * @param {Transport} transport
 * @param {Array<{balance: number, coinType: string}>} data
 */
export const updateBalance = async (transport: Transport, appId: string, appPrivKey: string, data: Array<{ balance: number; coinType: string; }>) => {
  const defaultBalance = '0.0';
  const coinTypes = ["00", "3c", "02", "90"];

  const allBalances = coinTypes.map(coinType => {
    const targetCoin = data.find(coin => {
      return coin.coinType === coinType;
    });


    const balance = targetCoin ? formatBalance(targetCoin.balance) : defaultBalance;
    const splitBalance = balance.split('.');
    const preNum = splitBalance[0].length > 8 ? splitBalance[0].slice(0, 8) : splitBalance[0].padStart(8, '0');
    const postNum = splitBalance[1].length > 8 ? splitBalance[1].slice(0, 8) : splitBalance[1].padEnd(8, '0');
    const fullBalance = preNum + postNum;
    const coinTypeAndBalance = coinType + fullBalance;
    return coinTypeAndBalance;
  });

  const concatBalance = allBalances.join('');

  const { signature, forceUseSC } = await getCommandSignature(
    transport,
    appId,
    appPrivKey,
    commands.UPDATE_BALANCE,
    concatBalance,
  )

  const executeCommandData = concatBalance + signature;

  const { statusCode, msg } = await executeCommand(transport, commands.UPDATE_BALANCE, target.MCU, executeCommandData, undefined, undefined, forceUseSC);

  // if (statusCode !== CODE._9000) {
  //   throw new APDUError(commands.UPDATE_BALANCE, statusCode, msg)
  // }
};
