import Transport, { CardType } from '../transport';
import { target } from '../config/param';
import { CODE } from '../config/status/code';
import { APDUError } from '../error/errorHandle';
import { getCommandSignature } from '../setting/auth';
import { powerOff } from './control';
import { error } from '..';
import { executeCommand } from '../apdu/execute/execute';
import { commands } from '../apdu/execute/command';

/**
 * Display "UPDATE" on wallet display
 * @param {Transport} transport
 */
export const showUpdate = async (transport: Transport) => {
  if (transport.cardType === CardType.Go) {
    throw new error.SDKError(showUpdate.name, `CoolWallet Go does not support this command.`);
  }
  const { statusCode, msg } = await executeCommand(transport, commands.START_UPDATE, target.MCU);
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.START_UPDATE, statusCode, msg);
  }
};

/**
 * Hide "UPDATE" on card
 * @param {Transport} transport
 */
export const hideUpdate = async (transport: Transport) => {
  if (transport.cardType === 'Go') {
    throw new error.SDKError(hideUpdate.name, `CoolWallet Go does not support this command.`);
  }
  const { statusCode, msg } = await executeCommand(transport, commands.FINISH_UPDATE, target.MCU);
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.FINISH_UPDATE, statusCode, msg);
  }
};

const formatBalance = function (balance: number, defaultValue = '0.0') {
  let result;
  if (isNaN(balance) || balance === null) {
    result = defaultValue;
  } else {
    if (balance < 0) {
      result = defaultValue;
    } else {
      const strVal = balance.toString();
      const splitVal = strVal.split('.');
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
export const updateBalance = async (
  transport: Transport,
  appId: string,
  appPrivKey: string,
  data: Array<{ balance: number; coinType: string }>
) => {
  if (transport.cardType === 'Go') {
    throw new error.SDKError(updateBalance.name, `CoolWallet Go does not support this command.`);
  }
  const defaultBalance = '0.0';
  const coinTypes = ['00', '3c', '02', '90'];

  const allBalances = coinTypes.map((coinType) => {
    const targetCoin = data.find((coin) => {
      return coin.coinType.toLowerCase() === coinType;
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

  const signature = await getCommandSignature(transport, appId, appPrivKey, commands.UPDATE_BALANCE, concatBalance);

  const executeCommandData = concatBalance + signature;

  const { statusCode, msg } = await executeCommand(
    transport,
    commands.UPDATE_BALANCE,
    target.SE,
    executeCommandData,
    undefined,
    undefined
  );
  await powerOff(transport);

  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.UPDATE_BALANCE, statusCode, msg);
  }
};
