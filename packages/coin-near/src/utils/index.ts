/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { utils, config } from '@coolwallet/core';
import * as params from '../config/params';
import * as types from '../config/types';
import { BN } from 'bn.js';
import * as base58 from 'bs58';

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

const convertNear = (num: string, decimal = 24): string => {
  num = num.replace(/,/g, '').trim();
  const split = num.split('.');
  const wholePart = split[0];
  const fracPart = split[1] || '';
  return trimLeadingZeroes(wholePart + fracPart.padEnd(decimal, '0'));
};

const getAmount = (num: string, pad = 32, decimal = 24): string => {
  if (!num) {
    return ''.padEnd(pad, '0');
  }
  const tBN = new BN(convertNear(num, decimal));
  return tBN.toString(16).padStart(pad, '0');
};

const getGas = (num: string, pad = 16): string => {
  if (!num) {
    return ''.padEnd(pad, '0');
  }
  const tBN = new BN(convertNear(num, 0));
  return tBN.toString(16).padStart(pad, '0');
};

const getArgument = async (txn: types.TransactionType): Promise<string> => {
  let actions = '';

  switch (txn.action.txnType) {
    case types.TxnType.TRANSFER: {
      actions = getAmount(txn.action.amount!);
      break;
    }
    case types.TxnType.STAKE: {
      actions =
        getAmount(txn.action.amount!) + Buffer.from(base58.decode(txn.action.validatorPublicKey!)).toString('hex');
      break;
    }
    case types.TxnType.SMART: {
      actions =
        txn.action.methodName!.length.toString(16).padStart(2, '0') +
        Buffer.from(txn.action.methodName!).toString('hex').padEnd(136, '0') +
        txn.action.methodArgs!.length.toString(16).padStart(2, '0') +
        Buffer.from(txn.action.methodArgs!).toString('hex').padEnd(136, '0') +
        getGas(txn.action.gas!) +
        getAmount(txn.action.amount!);
      break;
    }
    case types.TxnType.SCStake: {
      actions = getGas(txn.action.gas!) + getAmount(txn.action.amount!);
      break;
    }
    case types.TxnType.SCUnstakeAll: {
      actions = getGas(txn.action.gas!);
      break;
    }
    case types.TxnType.SCWithdrawAll: {
      actions = getGas(txn.action.gas!);
      break;
    }
    case types.TxnType.SCUnstake: {
      actions =
        (txn.action.amount!.length + 13).toString(16).padStart(2, '0') +
        getAmount(txn.action.amount!) + getGas(txn.action.gas!);
      break;
    }
    case types.TxnType.SCWithdraw: {
      actions =
        (txn.action.amount!.length + 13).toString(16).padStart(2, '0') +
        getAmount(txn.action.amount!) + getGas(txn.action.gas!);
      break;
    }
  }

  const serializedTx =
    txn.sender!.length.toString(16).padStart(2, '0') +
    Buffer.from(txn.sender!).toString('hex').padEnd(136, '0') +
    Buffer.from(base58.decode(txn.publicKey!)).toString('hex') +
    txn.nonce.toString(16).padStart(16, '0') +
    txn.receiver!.length.toString(16).padStart(2, '0') +
    Buffer.from(txn.receiver!).toString('hex').padEnd(136, '0') +
    Buffer.from(base58.decode(txn.recentBlockHash)).toString('hex') +
    actions;

  return (await addPath()) + serializedTx;
};

const getScriptArg = async (txn: types.TransactionType): Promise<{ script: string; argument: string }> => {
  let scrpt = '';

  switch (txn.action.txnType) {
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
    case types.TxnType.SCStake: {
      scrpt = params.SCStake.script + params.SCStake.signature;
      break;
    }
    case types.TxnType.SCUnstakeAll: {
      scrpt = params.SCUnstakeAll.script + params.SCUnstakeAll.signature;
      break;
    }
    case types.TxnType.SCWithdrawAll: {
      scrpt = params.SCWithdrawAll.script + params.SCWithdrawAll.signature;
      break;
    }
    case types.TxnType.SCUnstake: {
      scrpt = params.SCUnstake.script + params.SCUnstake.signature;
      break;
    }
    case types.TxnType.SCWithdraw: {
      scrpt = params.SCWithdraw.script + params.SCWithdraw.signature;
      break;
    }
  }

  const argument = await getArgument(txn);
  console.log('argument :', argument);

  return {
    script: scrpt,
    argument: argument,
  };
};

// Signed Transaction

function encodeInteger(value: string, bytes: number) {
  const tBN = new BN(value);
  return tBN.toBuffer('le', bytes).toString('hex');
}

function encodeAmount(amount: string) {
  const value = convertNear(amount);
  return encodeInteger(value, 16);
}

function encodeArray(value: string | Uint8Array) {
  const buf = Buffer.from(value);
  return encodeInteger(buf.length.toString(), 4) + buf.toString('hex').padStart(buf.length * 2, '0');
}

function encodePublicKey(publicKey: string) {
  return '00' + Buffer.from(base58.decode(publicKey)).toString('hex').padStart(64, '0');
}

function encodeBlockHash(blockHash: string) {
  return Buffer.from(base58.decode(blockHash)).toString('hex').padStart(64, '0');
}

function encodeSignature(signature: Buffer) {
  return '00' + signature.toString('hex').padStart(128, '0');
}

const getSignedTx = (txn: types.TransactionType, sig: Buffer): string => {
  const { sender, publicKey, receiver, nonce, recentBlockHash, action } = txn;

  let signedTx =
    encodeArray(sender!) +
    encodePublicKey(publicKey!) +
    encodeInteger(nonce!.toString(), 8) +
    encodeArray(receiver!) +
    encodeBlockHash(recentBlockHash);

  switch (action.txnType) {
    case types.TxnType.TRANSFER: {
      const { amount } = action;
      signedTx += '0100000003';
      signedTx += encodeAmount(amount!);
      break;
    }
    case types.TxnType.STAKE: {
      const { amount, validatorPublicKey } = action;
      signedTx += '0100000004';
      signedTx += encodeAmount(amount!);
      signedTx += encodePublicKey(validatorPublicKey!);
      break;
    }
    case types.TxnType.SMART: {
      const { amount, gas, methodName, methodArgs } = action;
      signedTx += '0100000002';
      signedTx += encodeArray(methodName!);
      signedTx += encodeArray(methodArgs!);
      signedTx += encodeInteger(gas!, 8);
      signedTx += encodeAmount(amount!);
      break;
    }
    case types.TxnType.SCStake: {
      const { amount, gas } = action;
      signedTx += '0100000002';
      signedTx += encodeArray('deposit_and_stake');
      signedTx += encodeArray('{}');
      signedTx += encodeInteger(gas!, 8);
      signedTx += encodeAmount(amount!);
      break;
    }
    case types.TxnType.SCUnstakeAll: {
      const { gas } = action;
      signedTx += '0100000002';
      signedTx += encodeArray('unstake_all');
      signedTx += encodeArray('{}');
      signedTx += encodeInteger(gas!, 8);
      signedTx += encodeAmount('0');
      break;
    }
    case types.TxnType.SCWithdrawAll: {
      const { gas } = action;
      signedTx += '0100000002';
      signedTx += encodeArray('withdraw_all');
      signedTx += encodeArray('{}');
      signedTx += encodeInteger(gas!, 8);
      signedTx += encodeAmount('0');
      break;
    }
    case types.TxnType.SCUnstake: {
      const { amount, gas } = action;
      signedTx += '0100000002';
      signedTx += encodeArray('unstake');
      signedTx += encodeArray(`{"amount":"${amount}"}`);
      signedTx += encodeInteger(gas!, 8);
      signedTx += encodeAmount('0');
      break;
    }
    case types.TxnType.SCWithdraw: {
      const { amount, gas } = action;
      signedTx += '0100000002';
      signedTx += encodeArray('withdraw');
      signedTx += encodeArray(`{"amount":"${amount}"}`);
      signedTx += encodeInteger(gas!, 8);
      signedTx += encodeAmount('0');
      break;
    }
  }
  signedTx += encodeSignature(sig);
  return signedTx;
};

export { getScriptArg, convertNear, getSignedTx };
