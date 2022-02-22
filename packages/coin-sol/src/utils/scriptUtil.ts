import { utils, config } from '@coolwallet/core';
import BigNumber from 'bignumber.js';
import * as params from '../config/params';
import base58 from 'bs58';
import { txType } from '../config/types';
import { handleHex } from './stringUtil';

/**
 * TODO
 * @param {*} transaction
 */
export const getTransferArguments = async (transaction: txType) => {
  const pathType = config.PathType.SLIP0010;
  const path = await utils.getPath(params.COIN_TYPE, 0, 3, pathType);
  const SEPath = `0D${path}`;
  console.debug('SEPath: ', SEPath);
  let argument = transferTxSerialize(transaction);

  return SEPath + argument;
};

const transferTxSerialize = (transaction: txType): string => {
  const formattedTx = {
    numberRequireSignature: '01',
    numberReadonlySignedAccount: '00',
    numberReadonlyUnSignedAccount: '01',
    keyCount: '03',
    from: transaction.fromPubkey,
    to: transaction.toPubkey,
    recentBlockHash: transaction.recentBlockHash,
    programIdIndex: transaction.txTypeIndex,
    keyIndicesCount: '02',
    keyIndices: '0001',
    dataLength: transaction.dataLength,
    data: transaction.data,
  };

  const fromBuf = typeof formattedTx.from === 'string' ? base58.decode(formattedTx.from) : formattedTx.from;
  const toBuf = typeof formattedTx.to === 'string' ? base58.decode(formattedTx.to) : formattedTx.to;

  const keys = Buffer.concat([fromBuf, toBuf, Buffer.alloc(32).fill(0)]).toString('hex');

  const recentBlockHash = base58.decode(formattedTx.recentBlockHash).toString('hex');

  const argument =
    handleHex(formattedTx.numberRequireSignature).padStart(2, '0') +
    handleHex(formattedTx.numberReadonlySignedAccount).padStart(2, '0') +
    handleHex(formattedTx.numberReadonlyUnSignedAccount).padStart(2, '0') +
    handleHex(formattedTx.keyCount).padStart(2, '0') +
    keys.padStart(192, '0') +
    recentBlockHash.padStart(64, '0') +
    handleHex('01').padStart(2, '0') +
    handleHex(formattedTx.programIdIndex as string).padStart(2, '0') +
    handleHex(formattedTx.keyIndicesCount).padStart(2, '0') +
    formattedTx.keyIndices.padStart(4, '0') +
    handleHex(formattedTx.dataLength as string).padStart(2, '0') +
    formattedTx.data.padStart(24, '0');

  return argument;
};
