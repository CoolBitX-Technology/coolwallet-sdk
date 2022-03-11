import { utils, config } from '@coolwallet/core';
import BigNumber from 'bignumber.js';
import * as params from '../config/params';
import base58 from 'bs58';
import { messageType } from '../config/types';
import { handleHex } from './stringUtil';

/**
 * TODO
 * @param {*} transaction
 */
export const getTransferArguments = async (transaction: messageType) => {
  const pathType = config.PathType.SLIP0010;
  const path = await utils.getPath(params.COIN_TYPE, 0, 3, pathType);
  const SEPath = `0D${path}`;
  console.debug('SEPath: ', SEPath);
  let argument = transactionSerialize(transaction);

  return SEPath + argument;
};

const numberToStringHex = (value: number | number[], pad: number) =>
  Buffer.from(typeof value === 'number' ? [value] : value)
    .toString('hex')
    .padStart(pad, '0');

const transactionSerialize = (transaction: messageType): string => {
  const { numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts } = transaction.header;
  const formattedTx = {
    numberRequireSignature: numberToStringHex(numRequiredSignatures, 2),
    numberReadonlySignedAccount: numberToStringHex(numReadonlySignedAccounts, 2),
    numberReadonlyUnSignedAccount: numberToStringHex(numReadonlyUnsignedAccounts, 2),
    keyCount: numberToStringHex(transaction.accountKeys.length, 2),
    recentBlockHash: transaction.recentBlockhash,
  };

  const keys = Buffer.concat(transaction.accountKeys).toString('hex');

  const recentBlockHash = base58.decode(formattedTx.recentBlockHash).toString('hex');

  let argument =
    handleHex(formattedTx.numberRequireSignature).padStart(2, '0') +
    handleHex(formattedTx.numberReadonlySignedAccount).padStart(2, '0') +
    handleHex(formattedTx.numberReadonlyUnSignedAccount).padStart(2, '0') +
    handleHex(formattedTx.keyCount).padStart(2, '0') +
    keys.padStart(192, '0') +
    recentBlockHash.padStart(64, '0') +
    numberToStringHex(transaction.instructions.length, 2);

  // iterate instruction
  transaction.instructions.forEach((instruction) => {
    let keyIndicesCount: number[] = [];
    encodeLength(keyIndicesCount, instruction.accounts.length);

    let dataCount: number[] = [];
    encodeLength(dataCount, instruction.data.length);
    const instructionData =
      numberToStringHex(instruction.programIdIndex, 2) +
      numberToStringHex(keyIndicesCount, 2) +
      numberToStringHex(instruction.accounts, 4) +
      numberToStringHex(dataCount, 2) +
      base58.decode(instruction.data).toString('hex').padStart(24, '0');
    argument = argument.concat(instructionData);
  });

  return argument;
};

function encodeLength(bytes: number[], len: number) {
  let rem_len = len;
  for (;;) {
    let elem = rem_len & 0x7f;
    rem_len >>= 7;
    if (rem_len == 0) {
      bytes.push(elem);
      break;
    } else {
      elem |= 0x80;
      bytes.push(elem);
    }
  }
}
