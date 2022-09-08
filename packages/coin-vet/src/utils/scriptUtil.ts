import { utils } from '@coolwallet/core';
import * as params from '../config/params';
import * as types from '../config/types';
import * as stringUtil from './stringUtil';
import * as token from './tokenUtil';
import Web3Utils from 'web3-utils';

const fastJsonStableStringify = require('fast-json-stable-stringify')

const getTransferArgument = (transaction: types.Record) => {

  const chainTag = stringUtil.handleHex(transaction.chainTag.toString()).padStart(2, '0');

  const blockRef = stringUtil.handleHex(transaction.blockRef).padStart(16,'0');

  const expiration = stringUtil.handleHex(transaction.expiration.toString()).padStart(8, '0');

  const clause = transaction.clauses[0];
  let to: string;
  if (clause.to == null) {
    to = "".padStart(40, '0');
  } else {
    to = stringUtil.handleHex(clause.to.toString());
  }

  const value = stringUtil.handleHex(clause.value.toString()).padStart(64, '0');

  const data = stringUtil.handleHex(clause.data).padStart(12, '0');

  const gasPriceCoef = stringUtil.handleHex(transaction.gasPriceCoef.toString()).padStart(2, '0');

  const gas = stringUtil.handleHex(transaction.gas.toString()).padStart(16, '0');

  const dependsOn = stringUtil.handleHex(transaction.dependsOn).padStart(64, '0');
  
  const nonce = stringUtil.handleHex(transaction.nonce).padStart(16, '0');

  let reserved: string
  if (transaction.reserved != null && transaction.reserved.features == 1) {
    reserved = stringUtil.handleHex(transaction.reserved.features.toString()).padStart(2,'0')
  } else {
    reserved = ''
  }

  const argument = chainTag+blockRef+expiration+to+value+data+gasPriceCoef+gas+dependsOn+nonce+reserved;
  
  return argument;
};

const getTokenArgument = (transaction: types.Record) => {

  const chainTag = stringUtil.handleHex(transaction.chainTag.toString()).padStart(2, '0');

  const blockRef = stringUtil.handleHex(transaction.blockRef).padStart(16,'0');

  const expiration = stringUtil.handleHex(transaction.expiration.toString()).padStart(8, '0');

  const clause = transaction.clauses[0];
  let to: string;
  if (clause.to == null) {
    to = "".padStart(40, '0');
  } else {
    to = stringUtil.handleHex(clause.to.toString());
  }

  const value = stringUtil.handleHex(clause.value.toString()).padStart(64, '0');

  const data = stringUtil.handleHex(clause.data).padStart(12, '0');

  const gasPriceCoef = stringUtil.handleHex(transaction.gasPriceCoef.toString()).padStart(2, '0');

  const gas = stringUtil.handleHex(transaction.gas.toString()).padStart(16, '0');

  const dependsOn = stringUtil.handleHex(transaction.dependsOn).padStart(64, '0');
  
  const nonce = stringUtil.handleHex(transaction.nonce).padStart(16, '0');

  let txTokenInfo: types.Option
  let tokenInfo: string = ''
  if (transaction.option != null) {
    txTokenInfo = transaction.option
    tokenInfo = token.getSetTokenPayload(
      to,
      txTokenInfo.info.symbol,
      parseInt(txTokenInfo.info.decimals)
    );
  }

  const argument = chainTag+blockRef+expiration+to+value+data+gasPriceCoef+gas+dependsOn+nonce+tokenInfo;
  
  return argument;
};

const getVIP191TransferArgument = (transaction: types.Record) => {

  const chainTag = stringUtil.handleHex(transaction.chainTag.toString()).padStart(2, '0');

  const blockRef = stringUtil.handleHex(transaction.blockRef).padStart(16,'0');

  const expiration = stringUtil.handleHex(transaction.expiration.toString()).padStart(8, '0');

  const clause = transaction.clauses[0];
  let to: string;
  if (clause.to == null) {
    to = "".padStart(40, '0');
  } else {
    to = stringUtil.handleHex(clause.to.toString());
  }

  const value = stringUtil.handleHex(clause.value.toString()).padStart(64, '0');

  const data = stringUtil.handleHex(clause.data).padStart(8, '0');

  const gasPriceCoef = stringUtil.handleHex(transaction.gasPriceCoef.toString()).padStart(2, '0');

  const gas = stringUtil.handleHex(transaction.gas.toString()).padStart(16, '0');

  const dependsOn = stringUtil.handleHex(transaction.dependsOn).padStart(64, '0');
  
  const nonce = stringUtil.handleHex(transaction.nonce).padStart(16, '0');

  let reserved: string
  if (transaction.reserved != null && transaction.reserved.features == 1) {
    reserved = stringUtil.handleHex(transaction.reserved.features.toString()).padStart(2,'0')
  } else {
    reserved = ''
  }

  const argument = chainTag+blockRef+expiration+to+value+data+gasPriceCoef+gas+dependsOn+nonce+reserved;
  
  return argument;
};

/**
 * @param {number} addressIndex
 * @param {*} transaction
 */
export const getScriptAndArguments = async (addressIndex: number, transaction: types.Record) => {
  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;

  const script = params.TRANSFER.scriptWithSignature;

  const argument = getTransferArgument(transaction);
  return {
    script,
    argument: SEPath + argument,
  };
};

/**
 * @param {number} addressIndex
 * @param {*} transaction
 */
 export const getVTHOScriptAndArguments = async (addressIndex: number, transaction: types.Record) => {
  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;

  const script  = params.TOKEN.scriptWithSignature;

  const argument = getTokenArgument(transaction);
  return {
    script,
    argument: SEPath + argument,
  };
};

/**
 * @param {number} addressIndex
 * @param {*} transaction
 */
 export const getVIP191ScriptAndArguments = async (addressIndex: number, transaction: types.Record) => {
  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;

  const script = params.TRANSFER_ORIGIN.scriptWithSignature;

  const argument = getVIP191TransferArgument(transaction);
  return {
    script,
    argument: SEPath + argument,
  };
};

/**
 * @param {number} addressIndex
 * @param {*} ceritficate
 */
 export const getCertificateScriptAndArgument = async (addressIndex: number, certificate: types.Certificate) => {
  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;

  const script = params.CERT.scriptWithSignature;
  const msgHex = fastJsonStableStringify({...certificate, signer: safeToLowerCase(certificate.signer)})
  const argument = stringUtil.handleHex(Web3Utils.toHex(msgHex));
  return {
    script,
    argument: SEPath + argument,
  };
};

export const safeToLowerCase = (str: string) => {
  return typeof str === 'string' ? str.toLowerCase() : str
}