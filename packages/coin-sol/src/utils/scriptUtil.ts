import { utils } from '@coolwallet/core';
import { PathType } from '@coolwallet/core/lib/config';
import base58 from 'bs58';
import { TOKEN_INFO } from '../config/tokenInfos';
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
  // If given token address can be found in official token list, use it instead of the user given one.
  const token = TOKEN_INFO.find((tok) => tok.address === tokenInfo.address) ?? tokenInfo;
  const tokenSignature = token.signature ?? '';
  const signature = tokenSignature.slice(82).padStart(144, '0');
  const tokenInfoToHex = Buffer.from([+token.decimals, token.symbol.length]).toString('hex');
  const tokenSymbol = Buffer.from(token.symbol.toUpperCase()).toString('hex').padEnd(14, '0');
  const tokenPublicKey = Buffer.from(base58.decode(token.address)).toString('hex');

  return tokenInfoToHex + tokenSymbol + tokenPublicKey + signature;
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
