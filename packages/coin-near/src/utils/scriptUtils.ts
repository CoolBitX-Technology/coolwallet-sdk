import { utils, config } from '@coolwallet/core';
import BigNumber from 'bignumber.js';
import * as params from '../config/params';
import * as types from '../config/types';
import * as nearAPI from 'near-api-js';

const addPath = async (argument: string, addressIndex: number): Promise<string> => {
	const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;
	return SEPath + argument;
};

const numberToHex = (num: number|string, pad = 20): string => {
	const tBN = new BigNumber(num);
	return tBN.toString(16).padStart(pad, '0');
};

const getTransferArgument = async (
  txn: types.txType
) => {

  // constructs actions that will be passed to the createTransaction method below
  const amount = nearAPI.utils.format.parseNearAmount(txn.amount);
  const actions = [nearAPI.transactions.transfer(amount)];
  
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

  const argument = '00000000000000989680'; //numberToHex('123.123'); // TODO: Round the number

  return await addPath(argument, 0) + serializedTx.toString('hex');
};

/**
 * @param {*} transaction
 */
const getScriptAndArguments = (
  txn: types.txType
) => {
  const script = params.TRANSFER.script + params.TRANSFER.signature;
  const argument = getTransferArgument(txn);

  return {
    script: script,
    argument: argument,
  };
};

export { getScriptAndArguments };
