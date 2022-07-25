import { apdu, error, tx } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
import * as types from './config/types';
import { handleHex } from './utils/stringUtil';

const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const rlp = require('rlp');
const blake = require('blakejs');
const blake2b = require('blake2b');

/**
 * Sign VeChain Transaction
 */
export async function signTransaction(
  signTxData: types.signTxType,
  publicKey: string
): Promise<string> {
  console.log("signing transaction...");
  const { transaction, transport, addressIndex, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const { script, argument } = await scriptUtil.getScriptAndArguments(addressIndex, transaction);

  console.log("sending script...")
  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  };
  preActions.push(sendScript);

  console.log("executing script....")
  const sendArgument = async () => {
    return await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);
  };

  console.log("getting single signature from cool wallet....")
  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    sendArgument,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  console.log(`retuning signature: ${signature.toString('hex')}`)

  return signature.toString('hex');;
}

/**
 * Sign VeChain Transaction
 */
export async function signTransaction2(
  signTxData: types.signTxType,
  publicKey: string
): Promise<string> {
  console.log('signing transaction without reserved...');
  const { transaction, transport, addressIndex, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const { script, argument } = await scriptUtil.getScriptAndArguments2(addressIndex, transaction);

  const sendScript = () => apdu.tx.sendScript(transport, script);
  preActions.push(sendScript);
  const action = () => apdu.tx.executeScript(transport, signTxData.appId, signTxData.appPrivateKey, argument);
  // const action = () => {
  //   console.log("executing")
  //   const es =  apdu.tx.executeScript(transport, signTxData.appId, signTxData.appPrivateKey, argument);
  //   console.log("after", es)
  //   return es
  // }

  console.log("getting single signature from cool wallet....")
  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  console.log("vet signature: ", signature);

  const { signedTx } = await apdu.tx.getSignedHex(transport);
  console.log("signedTx: ", signedTx);

  const rawTx = txUtil.getRawTx(transaction);
  const rawData = rlp.encode(rawTx);
  console.log("rawdata: ", rawData);
  console.log("signedTx rlp: ", rlp.encode(signedTx));
  console.log("rawdata hex", rawData.toString('hex'));

  // if (rawData.toString('hex') !== signedTx) {
  //   throw new Error('unexpected transaction format!');
  // }

  const hash = blake2b(32).update(rlp.encode(signedTx)).digest('hex')
  const data = Buffer.from(handleHex(hash), 'hex')
  const keyPair = ec.keyFromPublic(publicKey, 'hex');
  console.log("hex data: ", data);
  console.log("public key: ", publicKey);
  console.log("key pair", keyPair);
  
  const recoveryParam = ec.getKeyRecoveryParam(data, signature, keyPair.pub);
  const v = recoveryParam + 27;
  const { r, s } = signature as {r: string, s: string};

  // const vValue = v + transaction.chainTag * 2 + 8;
  const signedTransaction = [Buffer.from([v]), Buffer.from(r, 'hex'), Buffer.from(s, 'hex')]
  const serializedTx = rlp.encode(signedTransaction);
  return `0x${serializedTx.toString('hex')}`;
}

/** 
 * Sign VeChain Certificate
 */
export async function signCertificate(
  signTxData: types.signCertType,
  publicKey: string
): Promise<string> {
  const { transaction, transport, addressIndex, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const { script, argument } = await scriptUtil.getScriptAndArguments(addressIndex, transaction);

  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const sendArgument = async () => {
    return await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);
  };

  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    sendArgument,
    false,
    ()=>console.log("confirm"),
    ()=>console.log("authorise"),
    true
  );

  return signature.toString('hex');;
}

// /**
//  * computes blake2b 256bit hash of given data
//  * @param data one or more Buffer | string
//  */
//  export function blake2b256(...data: Array<Buffer | string>) {
//   const ctx = blake.blake2bInit(32, null)
//   data.forEach(d => {
//       if (Buffer.isBuffer(d)) {
//           blake.blake2bUpdate(ctx, d)
//       } else {
//           blake.blake2bUpdate(ctx, Buffer.from(d, 'utf8'))
//       }
//   })
//   return Buffer.from(blake.blake2bFinal(ctx), 'hex')
//   // return blake.blake2bFinal(ctx)
// }

export const blake2b256 = (input: Buffer) => {
  return Buffer.from(blake2b(32).update(input).digest())
}