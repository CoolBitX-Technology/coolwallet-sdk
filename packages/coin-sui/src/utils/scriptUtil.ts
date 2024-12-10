import { PathType } from '@coolwallet/core/lib/config';
import { utils } from '@coolwallet/core';
import { Transaction } from '@mysten/sui/transactions';
import { messageWithIntent } from '@mysten/sui/dist/cjs/cryptography/intent';
import * as types from '../config/types';
import BigNumber from 'bignumber.js';

/**
 * getTransferArguments
 *
 * @param {Transaction} rawTx transaction with extracted fields from a regular sol transaction
 * @param {boolean} isPartialArgs is getting full rawTx as argument or not
 * @returns {Promise<string>}
 */

function getTargetIndex(source: string, target: string) {
  const index = source.indexOf(target);
  if (index === -1) throw new Error(`getTargetIndex >>> target: ${target} not found in sui txHex: ${source}`);
  return index;
}

function getToAddressHexIndex(rawTx: Transaction, hex: string): string {
  const transferObjects = rawTx.getData().commands.filter((command) => command.TransferObjects);
  const toAddressObject = transferObjects[0].TransferObjects?.address as {
    $kind: 'Input';
    Input: number;
    type?: 'pure';
  };
  const toAddressIndex = toAddressObject.Input;
  const toAddressBase64 = rawTx.getData().inputs[toAddressIndex].Pure?.bytes;
  if (!toAddressBase64) throw new Error(`getCoinTransferArguments.getToAddressHexIndex >>> toAddressBase64 not found`);
  const toAddress = Buffer.from(toAddressBase64, 'base64').toString('hex');
  const toAddressHexIndex = getTargetIndex(hex, toAddress);

  // sdk 取 index 的單位是 byte ()，因此要先將 index 除二再 hex
  const toAddressHexIndexByByte = new BigNumber(toAddressHexIndex).dividedBy(2).toString(16).padStart(4, '0');

  return toAddressHexIndexByByte;
}

function getSendAmountHexIndex(rawTx: Transaction, hex: string): string {
  const splitCoins = rawTx.getData().commands.filter((command) => command.SplitCoins);
  const sendAmountObject = splitCoins[0].SplitCoins?.amounts[0] as {
    $kind: 'Input';
    Input: number;
    type?: 'pure';
  };
  const sendAmountIndex = sendAmountObject.Input;
  const sendAmountBase64 = rawTx.getData().inputs[sendAmountIndex].Pure?.bytes;
  if (!sendAmountBase64)
    throw new Error(`getCoinTransferArguments.getSendAmountHexIndex >>> sendAmountBase64 not found`);
  const sendAmountLittleEndian = Buffer.from(sendAmountBase64, 'base64').toString('hex');
  console.log(`sendAmountLittleEndian= ${sendAmountLittleEndian}`);
  const amountHexIndex = getTargetIndex(hex, sendAmountLittleEndian);
  const amountHexIndexByByte = new BigNumber(amountHexIndex).dividedBy(2).toString(16).padStart(4, '0');
  return amountHexIndexByByte;
}

async function getCoinTransferArguments(rawTx: Transaction, addressIndex: number): Promise<string> {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/784'/0'/0'/${addressIndex}'` });
  const SEPath = `11${path}`;
  console.debug('SUI.getCoinTransferArguments >>> SEPath: ', SEPath);

  const txBytes = await rawTx.build();
  const intentMessage = messageWithIntent('TransactionData', txBytes); // tx.sign 需要先包一層 intentMessage 才能簽署
  const intentMessageHex = Buffer.from(intentMessage).toString('hex');
  console.debug('SUI.getCoinTransferArguments >>> intentMessage: ', intentMessageHex);

  const toAddressHexIndex = getToAddressHexIndex(rawTx, intentMessageHex);
  const amountHexIndex = getSendAmountHexIndex(rawTx, intentMessageHex);
  const header = toAddressHexIndex + amountHexIndex;
  console.debug('SUI.getCoinTransferArguments >>> header: ', header);

  return SEPath + header + intentMessageHex;
}

function getTokenInfoArgs(tokenInfo: types.TokenInfo): string {
  const tokenDecimalsHex = Buffer.from([tokenInfo.decimals]).toString('hex'); // 06
  const scriptTokenSymbol = tokenInfo.symbol.slice(0, 7).toUpperCase(); // USDC
  const tokenSymbolLengthHex = Buffer.from([scriptTokenSymbol.length]).toString('hex'); // 04
  const tokenSymbolHex = Buffer.from(scriptTokenSymbol).toString('hex').padEnd(14, '0'); // 55534443000000

  return tokenDecimalsHex + tokenSymbolLengthHex + tokenSymbolHex;
}

async function getTokenTransferArguments(
  rawTx: Transaction,
  addressIndex: number,
  tokenInfo: types.TokenInfo
): Promise<string> {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/784'/0'/0'/${addressIndex}'` });
  const SEPath = `11${path}`;
  console.debug('SUI.getTokenTransferArguments >>> SEPath: ', SEPath);

  const txBytes = await rawTx.build();
  const intentMessage = messageWithIntent('TransactionData', txBytes);
  const intentMessageHex = Buffer.from(intentMessage).toString('hex');
  console.debug('SUI.getTokenTransferArguments >>> intentMessage: ', intentMessageHex);

  const toAddressHexIndex = getToAddressHexIndex(rawTx, intentMessageHex);
  const amountHexIndex = getSendAmountHexIndex(rawTx, intentMessageHex);
  const tokenInfoArgs = getTokenInfoArgs(tokenInfo);
  const header = toAddressHexIndex + amountHexIndex + tokenInfoArgs; // 00ba 00a6 060455534443000000
  console.debug('SUI.getTokenTransferArguments >>> header: ', header);
  return SEPath + header + intentMessageHex;
}

async function getSmartContractArguments(rawTx: Transaction, addressIndex: number): Promise<string> {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/784'/0'/0'/${addressIndex}'` });
  const SEPath = `11${path}`;
  console.debug('SUI.getSmartContractArguments >>> SEPath: ', SEPath);

  const txBytes = await rawTx.build();
  const intentMessage = messageWithIntent('TransactionData', txBytes);
  const intentMessageHex = Buffer.from(intentMessage).toString('hex');
  console.debug('SUI.getSmartContractArguments >>> intentMessage: ', intentMessageHex);

  return SEPath + intentMessageHex;
}

export { getCoinTransferArguments, getTokenTransferArguments, getSmartContractArguments };
