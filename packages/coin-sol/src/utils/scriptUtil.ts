import * as params from '../config/params';
import { utils, config } from '@coolwallet/core';
import { Transaction } from './transactionUtil';

/**
 * getTransferArguments
 * @param {TransferTx} TransferTx transaction with extracted fields from a regular sol transaction
 * @returns {Promise<string>}
 */
export const getTransferArguments = async (rawTx: Transaction, isPartialArgs: boolean): Promise<string> => {
  const pathType = config.PathType.SLIP0010;
  const path = await utils.getPath(params.COIN_TYPE, 0, 3, pathType);
  const SEPath = `0D${path}`;
  console.debug('SEPath: ', SEPath);

  return SEPath + rawTx.serializeArgument(isPartialArgs);
};
