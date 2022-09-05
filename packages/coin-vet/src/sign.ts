import { apdu, error, tx } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
import * as types from './config/types';
import { handleHex } from './utils/stringUtil';
import Web3Utils from 'web3-utils';

const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const rlp = require('rlp');
const blake2b = require('blake2b');
const fastJsonStableStringify = require('fast-json-stable-stringify')

/**
 * Sign VeChain Transaction
 */
export async function signTransaction(
  signTxData: types.signTxType,
  publicKey: string
): Promise<string> {
  const { transaction, transport, addressIndex, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const { script, argument } = await scriptUtil.getScriptAndArguments(addressIndex, transaction);

  const sendScript = () => apdu.tx.sendScript(transport, script);
  preActions.push(sendScript);
  const action = () => apdu.tx.executeScript(transport, signTxData.appId, signTxData.appPrivateKey, argument);

  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  const { signedTx } = await apdu.tx.getSignedHex(transport);


  const rawTx = txUtil.getRawTx(transaction);
  const rawData = rlp.encode(rawTx);
 
  const hash = blake2b(32).update(rawData).digest('hex')
  const data = Buffer.from(handleHex(hash), 'hex')
  const keyPair = ec.keyFromPublic(publicKey, 'hex');
  
  const recoveryParam = ec.getKeyRecoveryParam(data, signature, keyPair.pub);
  const v = recoveryParam;
  const { r, s } = signature as {r: string, s: string};
  const signedTransaction = Buffer.concat([Buffer.from(r, 'hex'), Buffer.from(s, 'hex'), Buffer.from([v])]);
  
  return `0x${signedTransaction.toString('hex')}`;
}

/**
 * Sign VeChain Token
 */
 export async function signToken(
  signTxData: types.signTxType,
  publicKey: string
): Promise<string> {
  const { transaction, transport, addressIndex, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const { script, argument } = await scriptUtil.getVTHOScriptAndArguments(addressIndex, transaction);

  const sendScript = () => apdu.tx.sendScript(transport, script);
  preActions.push(sendScript);
  const action = () => apdu.tx.executeScript(transport, signTxData.appId, signTxData.appPrivateKey, argument);

  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  const { signedTx } = await apdu.tx.getSignedHex(transport);


  const rawTx = txUtil.getRawTx(transaction);
  const rawData = rlp.encode(rawTx);
  const hash = blake2b(32).update(rawData).digest('hex')
  const data = Buffer.from(handleHex(hash), 'hex')
  const keyPair = ec.keyFromPublic(publicKey, 'hex');
  
  const recoveryParam = ec.getKeyRecoveryParam(data, signature, keyPair.pub);
  const v = recoveryParam;
  const { r, s } = signature as {r: string, s: string};
  const signedTransaction = Buffer.concat([Buffer.from(r, 'hex'), Buffer.from(s, 'hex'), Buffer.from([v])]);
  
  return `0x${signedTransaction.toString('hex')}`;
}

/**
 * Sign VIP191 Smart Contract
 */
 export async function signVIP191(
  signTxData: types.signTxType,
  publicKey: string
): Promise<string> {
  const { transaction, transport, addressIndex, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const { script, argument } = await scriptUtil.getVIP191ScriptAndArguments(addressIndex, transaction);

  const sendScript = () => apdu.tx.sendScript(transport, script);
  preActions.push(sendScript);
  const action = () => apdu.tx.executeScript(transport, signTxData.appId, signTxData.appPrivateKey, argument);

  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  const { signedTx } = await apdu.tx.getSignedHex(transport);


  const rawTx = txUtil.getRawTx(transaction);
  const rawData = rlp.encode(rawTx);
  const hash = blake2b(32).update(rawData).digest('hex')
  const data = Buffer.from(handleHex(hash), 'hex')
  const keyPair = ec.keyFromPublic(publicKey, 'hex');
  
  const recoveryParam = ec.getKeyRecoveryParam(data, signature, keyPair.pub);
  const v = recoveryParam;
  const { r, s } = signature as {r: string, s: string};
  const signedTransaction = Buffer.concat([Buffer.from(r, 'hex'), Buffer.from(s, 'hex'), Buffer.from([v])]);
  
  return `0x${signedTransaction.toString('hex')}`;
}

/** 
 * Sign VeChain Certificate
 */
export async function signCertificate(
  signTxData: types.signCertType,
  publicKey: string
): Promise<string> {
  const { certificate, transport, addressIndex, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const { script, argument } = await scriptUtil.getCertificateScriptAndArgument(addressIndex, certificate);

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
    confirmCB,
    authorizedCB,
    true
  );
  
  const msgJson = fastJsonStableStringify({...certificate, signer: scriptUtil.safeToLowerCase(certificate.signer)})
  const msgHex = handleHex(Web3Utils.toHex(msgJson))
  const hash = blake2b(32).update(Buffer.from(msgHex, 'hex')).digest('hex')
  const data = Buffer.from(handleHex(hash), 'hex')
  const keyPair = ec.keyFromPublic(publicKey, 'hex');

  const recoveryParam = ec.getKeyRecoveryParam(data, signature, keyPair.pub);
  const v = recoveryParam;
  const { r, s } = signature as {r: string, s: string};
  const signedTransaction = Buffer.concat([Buffer.from(r, 'hex'), Buffer.from(s, 'hex'), Buffer.from([v])]);
  
  return `0x${signedTransaction.toString('hex')}`;
}