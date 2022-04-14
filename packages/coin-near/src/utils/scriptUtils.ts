import { utils, config } from '@coolwallet/core';
import * as params from '../config/params';
import * as types from '../config/types';
import * as nearAPI from 'near-api-js';
import { BN } from 'bn.js';

const getScriptArg = async (
  txn: types.TransactionType
) : Promise<{ script: string, argument: string }>=> {
  let scrpt;

  switch(txn.action.txnType) { 
    case types.TxnType.TRANSFER: { 
      scrpt = params.TRANSFER.script + params.TRANSFER.signature;
      break;
    }
    case types.TxnType.STAKE: { 
      scrpt = params.STAKE.script + params.STAKE.signature;
      break; 
    }
    case types.TxnType.SMART: { 
      scrpt = params.SMART.script + params.SMART.signature;
      break; 
    }
    case types.TxnType.SMARTNOAMOUNT: { 
      scrpt = params.SMARTNOAMOUNT.script + params.SMARTNOAMOUNT.signature;
      break; 
    }
  } 

  const argument = await getArgument(txn);

  return {
    script: scrpt,
    argument: argument,
  };
};

const getArgument = async (
  txn: types.TransactionType
) : Promise<string> => {

  const amount = nearAPI.utils.format.parseNearAmount(txn.action.amount);
  
  let actions: nearAPI.transactions.Action[];

  switch(txn.action.txnType) { 
    case types.TxnType.TRANSFER: { 
      actions = [nearAPI.transactions.transfer(new BN(amount!))];
      break;
    } 
    case types.TxnType.STAKE: { 
      actions = [nearAPI.transactions.stake(new BN(amount!), nearAPI.utils.key_pair.PublicKey.from(txn.action.validatorPublicKey!))]; 
      break; 
    } 
    case types.TxnType.SMART:
    case types.TxnType.SMARTNOAMOUNT: { 
      actions = [nearAPI.transactions.functionCall(txn.action.methodName!, txn.action.methodArgs!,
        new BN(nearAPI.utils.format.parseNearAmount(txn.action.gas)!), new BN(amount!))];
      break; 
    } 
  } 
  // create transaction
  const transaction = nearAPI.transactions.createTransaction(
    txn.sender!, 
    nearAPI.utils.key_pair.PublicKey.from(txn.publicKey!), 
    txn.receiver!, 
    txn.nonce, 
    actions, 
    nearAPI.utils.serialize.base_decode(txn.recentBlockHash)
  );
  const serializedTx = nearAPI.utils.serialize.serialize(
    nearAPI.transactions.SCHEMA, 
    transaction
  );
  const argument = txn.action.txnType != types.TxnType.SMARTNOAMOUNT ? nearToDisplay(txn.action.amount!) : '';

  return await addPath(argument, 0) + Buffer.from(serializedTx).toString('hex');
};

const addPath = async (argument: string, addressIndex: number): Promise<string> => {
  
  const pathType = config.PathType.SLIP0010;
  const path = await utils.getPath(params.COIN_TYPE, 0, 3, pathType);

  const SEPath = `0D${path}`;

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

export { getScriptArg };
