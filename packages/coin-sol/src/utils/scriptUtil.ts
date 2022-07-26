import { utils } from '@coolwallet/core';
import { PathType } from '@coolwallet/core/lib/config';
import * as types from '../config/types';
import Transaction from './Transaction';

/**
 * getTransferArguments
 *
 * @param {Transaction} rawTx transaction with extracted fields from a regular sol transaction
 * @param {boolean} isPartialArgs is getting full rawTx as argument or not
 * @returns {Promise<string>}
 */
function getTransferArguments(rawTx: Transaction, addressIndex: number): string {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `11${path}`;
  console.debug('SEPath: ', SEPath);

  return SEPath + rawTx.compileMessage().serializeTransferMessage();
}

function getTokenInfoArgs(tokenInfo: types.TokenInfo): string {
  const signature = tokenInfo.signature ?? '';
  const tokenInfoToHex = Buffer.from([+tokenInfo.decimals, tokenInfo.symbol.length]).toString('hex');
  const tokenSymbol = Buffer.from(tokenInfo.symbol.toUpperCase()).toString('hex').padEnd(14, '0');

  return tokenInfoToHex + tokenSymbol + signature;
}

/**
 * getSplTokenTransferArguments
 *
 * @param {Transaction} rawTx transaction with extracted fields from a regular sol transaction
 * @param {boolean} isPartialArgs is getting full rawTx as argument or not
 * @returns {Promise<string>}
 */
function getSplTokenTransferArguments(rawTx: Transaction, addressIndex: number, tokenInfo?: types.TokenInfo): string {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `11${path}`;
  console.debug('SEPath: ', SEPath);
  let tokenInfoArgs = '';
  if (tokenInfo) tokenInfoArgs = getTokenInfoArgs(tokenInfo);

  return SEPath + rawTx.compileMessage().serializeTransferMessage() + tokenInfoArgs;
}

/**
 * getAssociateTokenAccount
 *
 * @param {Transaction} rawTx transaction with extracted fields from a regular sol transaction
 * @param {boolean} isPartialArgs is getting full rawTx as argument or not
 * @returns {Promise<string>}
 */
function getAssociateTokenAccount(rawTx: Transaction, addressIndex: number): string {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `11${path}`;
  console.debug('SEPath: ', SEPath);

  return SEPath + rawTx.compileMessage().serializeAssociateTokenAccount();
}

function getCreateAndTransferSPLToken(rawTx: Transaction, addressIndex: number, tokenInfo?: types.TokenInfo): string {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `11${path}`;
  console.debug('SEPath: ', SEPath);
  let tokenInfoArgs = '';
  if (tokenInfo) tokenInfoArgs = getTokenInfoArgs(tokenInfo);

  return SEPath + rawTx.compileMessage().serializeCreateAndTransferSPLToken() + tokenInfoArgs;
}

function getDelegateArguments(rawTx: Transaction, addressIndex: number): string {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `11${path}`;
  console.debug('SEPath: ', SEPath);

  return SEPath + rawTx.compileMessage().serializeDelegate();
}

function getUndelegateArguments(rawTx: Transaction, addressIndex: number): string {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `11${path}`;
  console.debug('SEPath: ', SEPath);

  return SEPath + rawTx.compileMessage().serializeUndelegate();
}

function getDelegateAndCreateAccountArguments(rawTx: Transaction, addressIndex: number): string {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `11${path}`;
  console.debug('SEPath: ', SEPath);

  return SEPath + rawTx.compileMessage().serializeDelegateAndCreateAccountWithSeed();
}

function getSmartContractArguments(rawTx: Transaction, addressIndex: number): string {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `11${path}`;
  console.debug('SEPath: ', SEPath);

  return SEPath + rawTx.compileMessage().serialize();
}

function getStackingWithdrawArguments(rawTx: Transaction, addressIndex: number): string {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `11${path}`;
  console.debug('SEPath: ', SEPath);

  return SEPath + rawTx.compileMessage().serializeStakingWithdraw();
}

export {
  getAssociateTokenAccount,
  getSplTokenTransferArguments,
  getCreateAndTransferSPLToken,
  getTransferArguments,
  getSmartContractArguments,
  getDelegateArguments,
  getUndelegateArguments,
  getDelegateAndCreateAccountArguments,
  getStackingWithdrawArguments,
};
