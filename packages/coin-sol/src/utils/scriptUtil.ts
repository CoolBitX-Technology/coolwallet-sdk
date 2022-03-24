import { utils, config } from '@coolwallet/core';
import * as params from '../config/params';
import { RawTransaction } from './transactionUtil';

/**
 * getTransferArguments
 * @param {RawTransaction} RawTransaction transaction with extracted fields from a regular sol transaction
 * @returns {Promise<string>}
 */
export const getTransferArguments = async (rawTx: RawTransaction): Promise<string> => {
  const pathType = config.PathType.SLIP0010;
  const path = await utils.getPath(params.COIN_TYPE, 0, 3, pathType);
  const SEPath = `0D${path}`;
  console.debug('SEPath: ', SEPath);
  let argument = rawTx.serializeArgument();

  return SEPath + argument;
};
