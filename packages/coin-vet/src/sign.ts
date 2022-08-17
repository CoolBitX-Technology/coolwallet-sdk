import { apdu, error, tx } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
import * as types from './config/types';
import { handleHex } from './utils/stringUtil';
import { blake2b256 } from './vet/blake2b';
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

  console.log("vet signature: ", signature);

  const { signedTx } = await apdu.tx.getSignedHex(transport);
  console.log("signedTx: ", signedTx);

  const rawTx = txUtil.getRawTx(transaction);
  const rawData = rlp.encode(rawTx);
  console.log("rawData: ", rawData.toString('hex'))
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
 * Sign VeChain Transaction (sponsor)
 */
export async function signDelegatorTransaction(signTxData: types.signDelegatorTxType, publicKey: string): Promise<string> {
  const { transaction, transport, addressIndex, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const { script, argument } = await scriptUtil.getDelegatorScriptAndArguments(addressIndex, transaction);

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

  console.log('vet signature: ', signature);

  const { signedTx } = await apdu.tx.getSignedHex(transport);
  console.log('signedTx: ', signedTx);

  const rawTx = txUtil.getRawDelegatorTx(transaction);
  const rawData = rlp.encode(rawTx);
  console.log("rawData: ", rawData.toString('hex'))
  // const hash = blake2b(32).update(rawData).digest('hex');
  const hash = blake2b(32).update(rawData).digest('hex');
  console.log("hash: ", hash);
  console.log("vhash:", blake2b256(Buffer.from(rawData)).toString('hex'))
  
  const delegatorFor = handleHex(transaction.delegatorFor)
  console.log("delegatorFor: ", delegatorFor);
  
  const finalHash = blake2b(32).update(Buffer.from(hash, 'hex')).update(Buffer.from(delegatorFor, 'hex')).digest('hex');
  // const finalHash = blake2b(32).update(Buffer.from(hash, 'hex')).digest('hex');
  console.log("finalHash:", finalHash)
  console.log("try hash:", blake2b256(Buffer.from(hash + delegatorFor, 'hex')).toString('hex'));
  console.log("vechain try hash:", blake2b256(Buffer.from(hash + delegatorFor, 'hex')).toString('hex'));
  console.log("vechain hash:", blake2b256(Buffer.from(hash, 'hex'), Buffer.from(delegatorFor, 'hex')).toString('hex'));
  // console.log("vechain hash:", blake2b256(Buffer.from(hash, 'hex')).toString('hex'));
  
  const data = Buffer.from(handleHex(finalHash), 'hex');
  const keyPair = ec.keyFromPublic(publicKey, 'hex');

  const recoveryParam = ec.getKeyRecoveryParam(data, signature, keyPair.pub);
  const v = recoveryParam;
  const { r, s } = signature as { r: string; s: string };
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
  
  const { signedTx } = await apdu.tx.getSignedHex(transport);
  console.log("signedTx: ", signedTx);

  const msgJson = fastJsonStableStringify({...certificate, signer: scriptUtil.safeToLowerCase(certificate.signer)})
  const msgHex = handleHex(Web3Utils.toHex(msgJson))

  console.log("msgHex: ", msgHex)
  const hash = blake2b(32).update(Buffer.from(msgHex, 'hex')).digest('hex')
  const data = Buffer.from(handleHex(hash), 'hex')
  const keyPair = ec.keyFromPublic(publicKey, 'hex');
  
  const recoveryParam = ec.getKeyRecoveryParam(data, signature, keyPair.pub);
  const v = recoveryParam;
  const { r, s } = signature as {r: string, s: string};
  const signedTransaction = Buffer.concat([Buffer.from(r, 'hex'), Buffer.from(s, 'hex'), Buffer.from([v])]);
  
  return `0x${signedTransaction.toString('hex')}`;
}