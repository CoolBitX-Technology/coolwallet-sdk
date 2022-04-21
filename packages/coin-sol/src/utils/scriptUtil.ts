import * as params from '../config/params';
import * as types from '../config/types';
import { utils, config } from '@coolwallet/core';
import { Transaction } from './transactionUtil';
import { TOKEN_INFO } from '../config/tokenInfos';
import { isBase58Format } from './stringUtil';
import base58 from 'bs58';

/**
 * getTransferArguments
 * @param {Transaction} rawTx transaction with extracted fields from a regular sol transaction
 * @param {boolean} isPartialArgs is getting full rawTx as argument or not
 * @returns {Promise<string>}
 */
export const getTransferArguments = async (rawTx: Transaction, isPartialArgs: boolean): Promise<string> => {
  const pathType = config.PathType.SLIP0010;
  const path = await utils.getPath(params.COIN_TYPE, 0, 3, pathType);
  const SEPath = `0D${path}`;
  console.debug('SEPath: ', SEPath);

  return SEPath + rawTx.serializeArgument(isPartialArgs);
};

export const getTokenInfoArgs = (tokenInfo: types.TokenInfo): string => {
  const signature = tokenInfo.signature || '';
  const tokenInfoToHex = Buffer.from([tokenInfo.decimals, tokenInfo.symbol.length]).toString('hex');
  const tokenSymbol = Buffer.from(tokenInfo.symbol.toUpperCase()).toString('hex').padEnd(14, '0');
  const tokenAddress = base58.decode(tokenInfo.address).toString('hex').slice(0, 64);

  return tokenInfoToHex + tokenSymbol + tokenAddress + signature;
};
