import { utils, config } from '@coolwallet/core';
import * as params from '../config/params';
import * as types from '../config/types';
import * as nearAPI from 'near-api-js';
import { BN } from 'bn.js';
const base58 = require('bs58');


const publicKeyToAddress = (
  publicKey: string
) => {
  return base58.decode(publicKey);
};

const getScriptAndArguments = (
  txn: types.Transaction
) => {
  const script = params.TRANSFER.script + params.TRANSFER.signature;
  const argument = getTransferArgument(txn);

  console.log(argument);
  return {
    script: script,
    argument: argument,
  };
};

const getTransferArgument = async (
  txn: types.Transaction
) => {

  // constructs actions that will be passed to the createTransaction method below
  const amount = nearAPI.utils.format.parseNearAmount(txn.amount);
  const actions = [nearAPI.transactions.transfer(new BN(amount ? amount : '0'))];
  
  // create transaction
  const transaction = nearAPI.transactions.createTransaction(
    txn.sender, 
    nearAPI.utils.key_pair.PublicKey.from(txn.publicKey), 
    txn.receiver, 
    txn.nonce, 
    actions, 
    nearAPI.utils.serialize.base_decode(txn.recentBlockHash)
  );

  const serializedTx = nearAPI.utils.serialize.serialize(
    nearAPI.transactions.SCHEMA, 
    transaction
  );

  const argument = nearToDisplay(txn.amount);

  return await addPath(argument, 0) + Buffer.from(serializedTx).toString('hex');
};

const addPath = async (argument: string, addressIndex: number): Promise<string> => {
	const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;
	return SEPath + argument;
};

function trimLeadingZeroes(value: string): string {
  value = value.replace(/^0+/, '');
  if (value === '') {
      return '0';
  }
  return value;
}

const nearToDisplay = (num: string, pad = 20): string => {
  if (!num) { return ''.padEnd(pad, '0'); }
  num = num.replace(/,/g, '').trim();
  const split = num.split('.');
  const wholePart = split[0];
  const fracPart = split[1] || '';
  const tBN = new BN(trimLeadingZeroes(wholePart + fracPart.padEnd(18, '0')));
  return tBN.toString(16).padStart(pad, '0');
};

export { publicKeyToAddress, getScriptAndArguments };
