import { utils, config } from '@coolwallet/core';
import BigNumber from 'bignumber.js';
import * as params from '../config/params';
import * as Stellar from 'stellar-sdk';
import { PROTOCOL } from '../config/types';

const getTransferArgument = (transaction: any) => {
  const isCreate = transaction.isCreate ? '00' : '01';
  let memoType;
  let memo = transaction.memo;
  switch (transaction.memoType) {
    case Stellar.MemoHash:
      memoType = '03';
      break;
    case Stellar.MemoReturn:
      memoType = '04';
      break;
    case Stellar.MemoText:
      memoType = '01';
      memo = Buffer.from(memo, 'ascii').toString('hex');
      break;
    case Stellar.MemoID:
      memoType = '02';
      memo = parseInt(memo).toString(16);
      break;
    case Stellar.MemoNone:
    default:
      memoType = '00';
      break;
  }

  const minTime = transaction.minTime ? transaction.minTime : '0';
  const maxTime = transaction.maxTime ? transaction.maxTime : '0';

  const argument =
    transaction.from +
    transaction.to +
    parseInt(transaction.amount).toString(16).padStart(16, '0') +
    parseInt(transaction.fee).toString(16).padStart(16, '0') +
    new BigNumber(transaction.sequence).toString(16).padStart(16, '0') +
    parseInt(minTime).toString(16).padStart(16, '0') +
    parseInt(maxTime).toString(16).padStart(16, '0') +
    memoType.padStart(2, '0') + //memoType
    memo.padStart(64, '0') + //memo
    isCreate.padStart(2, '0'); //isCreate

  console.debug('argument:' + argument);
  return argument;
};

/**
 * TODO
 * @param {number} addressIndex
 * @param {*} transaction
 */
const getScriptAndArguments = async (
  transaction: object,
  transfer: { script: string; signature: string },
  protocol: PROTOCOL
) => {
  const pathType = protocol === PROTOCOL.BIP44 ? config.PathType.BIP32EDDSA : config.PathType.SLIP0010;
  const path = await utils.getPath(params.COIN_TYPE, 0, 3, pathType);
  const SEPath = `0D${path}`;
  console.debug('SEPath: ', SEPath);
  const script = transfer.script + transfer.signature;
  const argument = getTransferArgument(transaction);

  return {
    script,
    argument: SEPath + argument,
  };
};

export { getScriptAndArguments };
