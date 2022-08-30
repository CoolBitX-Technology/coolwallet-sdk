import { coin as COIN, error as ERROR, utils, config } from '@coolwallet/core';
import * as params from '../config/params';
import * as types from '../config/types';
import { getTransactionArgument } from './transactionUtils';
const msgpack = require('algo-msgpack-with-bigint');

const getScriptAndArgument = (transaction: types.Transaction): { script: string; argument: Buffer[] } => {
  const signature = params[transaction.type].signature;
  const script = params[transaction.type].script;
  const fields = params[transaction.type].fields;
  if (!(script && signature && fields))
    throw new ERROR.SDKError(getScriptAndArgument.name, `Transaction type ${transaction.type} is not supported`);
  const argument = getTransactionArgument(transaction, fields);
  return { script: script + signature, argument };
};

const getSignedTransaction = async (signTxData: types.SignTxType, sig: Buffer) => {
  const path = utils.getFullPath({
    pathType: config.PathType.SLIP0010,
    pathString: "44'/283'/0'/0'/0'",
  });
  const publicKey = await COIN.getPublicKeyByPath(
    signTxData.transport,
    signTxData.appId,
    signTxData.appPrivateKey,
    path
  );

  const signedTransaction: types.AlgorandRawTransactionStruct = {
    sig: sig,
    txn: signTxData.transaction,
  };

  const sender = signTxData.transaction.snd.toString('hex');

  if (publicKey !== sender) {
    signedTransaction.sgnr = Buffer.from(publicKey, 'hex');
  }
  const options = { sortKeys: true };
  return Buffer.from(msgpack.encode(signedTransaction, options)).toString('hex');
};

export { getScriptAndArgument, getSignedTransaction };
