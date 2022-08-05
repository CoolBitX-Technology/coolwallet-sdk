import { coin as COIN, error as ERROR, utils, config } from '@coolwallet/core';
import nacl from "tweetnacl";
import base32 from "hi-base32";
import sha512 from "js-sha512";
import * as params from '../config/params';
import * as types from '../config/types';
import { getTransactionArgument } from "./transactionUtils";
const msgpack = require('algo-msgpack-with-bigint');

const PUBLIC_KEY_LENGTH = nacl.sign.publicKeyLength;
const ALGORAND_ADDRESS_LENGTH = 58;
const ALGORAND_CHECKSUM_BYTE_LENGTH = 4;

function concatArrays(...arrs: ArrayLike<number>[]): Uint8Array {
  const size = arrs.reduce((sum, arr) => sum + arr.length, 0);
  const c = new Uint8Array(size);

  let offset = 0;
  for (let i = 0; i < arrs.length; i++) {
    c.set(arrs[i], offset);
    offset += arrs[i].length;
  }
  return c;
}

const pubKeyToAddress = async (publicKey: string) => {
  const publicKeyBytes = Buffer.from(publicKey, 'hex');
  const checksum = sha512.sha512_256
    .array(publicKeyBytes)
    .slice(
      PUBLIC_KEY_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH,
      PUBLIC_KEY_LENGTH
    );
  const addr = base32.encode(concatArrays(publicKeyBytes, checksum));
  return addr.toString().slice(0, ALGORAND_ADDRESS_LENGTH);
}

const getScriptAndArgument = (
  transaction: types.Transaction
): { script: string; argument: Buffer[] } => {
  const signature = params[transaction.type].signature;
  const script = params[transaction.type].script;
  const fields = params[transaction.type].fields;
  if (!(script && signature && fields)) throw new ERROR.SDKError(getScriptAndArgument.name, `Transaction type ${transaction.type} is not supported`)
  const argument = getTransactionArgument(transaction, fields);
  return { script: script + signature, argument };
};

const getSignedTransaction = async (
  signTxData: types.SignTxType,
  sig: Buffer
) => {
  const path = utils.getFullPath({
    pathType: config.PathType.SLIP0010,
    pathString: "44'/283'/0'/0'/0'",
  });
  const publicKey = await COIN.getPublicKeyByPath(signTxData.transport, signTxData.appId, signTxData.appPrivateKey, path);

  const signedTransaction: types.AlgorandRawTransactionStruct = {
    sig: sig,
    txn: signTxData.transaction,
  };

  const sender = signTxData.transaction.snd.toString("hex")

  if (publicKey !== sender) {
    signedTransaction.sgnr = Buffer.from(publicKey, 'hex');
  }
  const options = { sortKeys: true };
  return Buffer.from(msgpack.encode(signedTransaction, options)).toString("hex")
};

export {
  pubKeyToAddress,
  getScriptAndArgument,
  getSignedTransaction
};