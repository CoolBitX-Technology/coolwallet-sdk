/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { utils, config } from '@coolwallet/core';
import * as params from '../config/params';
import * as types from '../config/types';
import { sha3_256 } from 'js-sha3';

const getPath = (addressIndex=0) => {
  const slip10PathType = config.PathType.SLIP0010.toString();
  const path =
    slip10PathType +
    '8000002C' +
    params.COIN_TYPE +
    '80000000' +
    '80000000' +
    (Math.floor(addressIndex) + 0x80000000).toString(16);

  return path;
};

const publicKeyToAuthenticationKey = (publicKey: string) => {
  const publicKeyAndScheme = Buffer.concat([Buffer.from(publicKey, 'hex'), Buffer.alloc(1)]);
  const authenticationKey = sha3_256(publicKeyAndScheme);
  console.log('publicKeyAndScheme :', publicKeyAndScheme.toString('hex'));
  console.log('authenticationKey  :', authenticationKey);
  return authenticationKey;
};

function trimLeadingZeroes(value: string): string {
  value = value.replace(/^0+/, '');
  if (value === '') {
    return '0';
  }
  return value;
}

const getScript = async (txn: types.TransactionType): Promise<string> => {
  return '';
};

const getArgument = async (txn: types.TransactionType): Promise<string> => {
  return '';
};

// Signed Transaction

const getSignedTx = (txn: types.TransactionType, sig: Buffer): string => {
  const { sender, publicKey, receiver, nonce, recentBlockHash, action } = txn;
  return '';
};

export { getPath, publicKeyToAuthenticationKey, getScript, getArgument, getSignedTx };
