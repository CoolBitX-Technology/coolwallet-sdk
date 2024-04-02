import { utils } from '@coolwallet/core';
import { PathType } from '@coolwallet/core/lib/config';
import base58 from 'bs58';
import * as types from '../config/types';
import { createSignInMessage } from './signIn';
import { Transaction } from './Transaction';
import { VersionedMessage } from '../message';
import { apdu } from '@coolwallet/core';

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
  const tokenSignature = tokenInfo.signature ?? '';
  const signature = tokenSignature.slice(82).padStart(144, '0');
  const tokenInfoToHex = Buffer.from([+tokenInfo.decimals, tokenInfo.symbol.length]).toString('hex');
  const tokenSymbol = Buffer.from(tokenInfo.symbol.toUpperCase()).toString('hex').padEnd(14, '0');
  const tokenPublicKey = Buffer.from(base58.decode(tokenInfo.address)).toString('hex');

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
  const compiledMessage = rawTx.compileMessage();
  const header = compiledMessage.serializeHeader();
  return SEPath + header + compiledMessage.serializeUndelegate();
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

  return SEPath + Buffer.from(rawTx.compileMessage().serialize()).toString('hex');
}

function getStackingWithdrawArguments(rawTx: Transaction, addressIndex: number): string {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `11${path}`;
  console.debug('SEPath: ', SEPath);

  return SEPath + rawTx.compileMessage().serializeStakingWithdraw();
}

function getSignInArguments(message: types.SignInMessage, addressIndex: number): string {
  const PATH_LENGTH = '11';
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `${PATH_LENGTH}${path}`;
  console.debug('SEPath: ', SEPath);
  const argument = createSignInMessage(message, path);
  return SEPath + argument;
}

function getSignMessageArguments(message: string, addressIndex: number): string {
  const PATH_LENGTH = '11';
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `${PATH_LENGTH}${path}`;
  console.debug('SEPath: ', SEPath);
  const argument = message.startsWith('0x') ? message.slice(2) : message;
  return SEPath + argument;
}

function getSignVersionedArguments(rawTx: VersionedMessage, addressIndex: number): string {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
  const SEPath = `11${path}`;
  console.debug('SEPath: ', SEPath);
  return SEPath + Buffer.from(rawTx.serialize()).toString('hex');
}

export function getScriptSigningPreActions(
  signData: types.signVersionedTransactions,
  script: string
): {
  preActions: Array<() => Promise<void>>;
} {
  const { transport } = signData;

  const preActions = [];
  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  };
  preActions.push(sendScript);

  return { preActions };
}

function getScriptSigningActions(signData: types.signVersionedTransactions): {
  actions: Array<() => Promise<string | undefined>>;
} {
  const { transport, appPrivateKey, appId, addressIndex } = signData;
  const versionedTxs = signData.transaction;
  const actions = versionedTxs.map((tx) => async () => {
    const argument = getSignVersionedArguments(tx.message, addressIndex);
    return apdu.tx.executeScript(transport, appId, appPrivateKey, argument);
  });
  return { actions };
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
  getSignInArguments,
  getSignMessageArguments,
  getSignVersionedArguments,
  getScriptSigningActions,
};
