import { utils, config } from '@coolwallet/core';
import * as params from '../config/params';
import * as types from '../config/types';
import { BN } from 'bn.js';
import * as base58 from 'bs58';

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

  let actions = '';

  switch(txn.action.txnType) { 
    case types.TxnType.TRANSFER: { 
      actions = getAmount(txn.action.amount!);
      break;
    } 
    case types.TxnType.STAKE: { 
      actions = getAmount(txn.action.amount!) + 
      Buffer.from(base58.decode(txn.action.validatorPublicKey!)).toString('hex');
      break; 
    } 
    case types.TxnType.SMART: { 
      actions = txn.action.methodName!.length.toString(16).padStart(2, '0') +
      Buffer.from(txn.action.methodName!).toString('hex').padEnd(136, '0') +
      txn.action.methodArgs!.length.toString(16).padStart(2, '0') +
      Buffer.from(txn.action.methodArgs!).toString('hex').padEnd(136, '0') +
      getAmount(txn.action.gas!, 16) +
      getAmount(txn.action.amount!);
      break; 
    } 
  } 

  const serializedTx = txn.sender!.length.toString(16).padStart(2, '0') +
    Buffer.from(txn.sender!).toString('hex').padEnd(136, '0') + 
    Buffer.from(base58.decode(txn.publicKey!)).toString('hex') +
    txn.nonce.toString(16).padStart(16, '0') + 
    txn.receiver!.length.toString(16).padStart(2, '0') +
    Buffer.from(txn.receiver!).toString('hex').padEnd(136, '0') +
    Buffer.from(base58.decode(txn.recentBlockHash)).toString('hex') +
    actions +
    getAmount(txn.action.amount!, 20, 10);

  return await addPath() + serializedTx;
};

const addPath = async (): Promise<string> => {
  const pathType = config.PathType.SLIP0010;
  const path = await utils.getPath(params.COIN_TYPE, 0, 3, pathType);
	return `0D${path}`;
};

function trimLeadingZeroes(value: string): string {
  value = value.replace(/^0+/, '');
  if (value === '') {
      return '0';
  }
  return value;
}

const getAmount = (num: string, pad = 32, decimal = 24): string => {
  if (!num) { return ''.padEnd(pad, '0'); }
  num = num.replace(/,/g, '').trim();
  const split = num.split('.');
  const wholePart = split[0];
  const fracPart = split[1] || '';
  const tBN = new BN(trimLeadingZeroes(wholePart + fracPart.padEnd(decimal, '0')));
  return tBN.toString(16).padStart(pad, '0');
};

export { getScriptArg };
