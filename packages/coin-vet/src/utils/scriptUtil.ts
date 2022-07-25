import { utils } from '@coolwallet/core';
import * as params from '../config/params';
import * as types from '../config/types';
import * as stringUtil from './stringUtil';

const getTransferArgument = (transaction: types.Record) => {
  console.log('getting transfer argument....');

  const chainTag = stringUtil.handleHex(transaction.chainTag.toString()).padStart(2, '0');
  console.log(`chainTag: ${transaction.chainTag} hex: ${chainTag}`);

  const blockRef = stringUtil.handleHex(transaction.blockRef).slice(2);
  console.log(`blockRef: ${transaction.blockRef} hex: ${blockRef}`);

  const expiration = stringUtil.handleHex(transaction.expiration.toString()).padStart(8, '0');
  console.log(`expiration: ${transaction.expiration} hex: ${expiration}`);

  const clause = transaction.clauses[0];
  let to: string;
  if (clause.to == null) {
    to = "".padStart(40, '0');
  } else {
    to = stringUtil.handleHex(clause.to.toString()).slice(2);
  }
  console.log(`to: ${clause.to} hex: ${to}`);

  const value = stringUtil.handleHex(clause.value.toString()).padStart(64, '0');
  console.log(`value: ${clause.value} hex: ${value}`);

  const data = stringUtil.handleHex(clause.data);
  console.log(`data: ${clause.data} hex: ${data}`);

  const gasPriceCoef = stringUtil.handleHex(transaction.gasPriceCoef.toString()).padStart(2, '0');
  console.log(`gasPriceCoef: ${transaction.gasPriceCoef} hex: ${gasPriceCoef}`);

  const gas = stringUtil.handleHex(transaction.gas.toString()).padStart(16, '0');
  console.log(`gas: ${transaction.gas} hex: ${gas}`);

  let dependsOn: string;
  if (transaction.dependsOn == null) {
    dependsOn = ''.padStart(64, '0');
  } else {
    dependsOn = stringUtil.handleHex(transaction.dependsOn).padStart(64, '0');
  }
  console.log(`dependsOn: ${transaction.dependsOn} dependsOn: ${dependsOn}`);

  const nonce = stringUtil.handleHex(transaction.nonce.toString()).padStart(16, '0');
  console.log(`nonce: ${transaction.nonce} hex: ${nonce}`);

  const argument = chainTag+blockRef+expiration+to+value+data+gasPriceCoef+gas+dependsOn+nonce;
  // stringUtil.handleHex().slice(2) +
  // stringUtil.handleHex(clause.value).padStart(20, '0') +
  // stringUtil.handleHex(transaction.timestamp).padStart(20, '0') +
  // stringUtil.handleHex(transaction.nid.toString(16)).padStart(4, '0');
  return argument;
};
/**
 * @param {number} addressIndex
 * @param {*} transaction
 */
export const getScriptAndArguments = async (addressIndex: number, transaction: types.Record) => {
  console.log('getting script and argument....');
  // const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  // const SEPath = `15328000002C${params.COIN_TYPE}8000000000000000${addressIdxHex}`;
  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;
  const script = params.TRANSFER.script + params.TRANSFER.signature;
  const argument = getTransferArgument(transaction);
  const finalArgument = SEPath + argument;
  console.log({ script, finalArgument });
  return {
    script,
    argument: SEPath + argument,
  };
};

/**
 * @param {number} addressIndex
 * @param {*} transaction
 */
export const getScriptAndArguments2 = async (addressIndex: number, transaction: types.Record) => {
  console.log('getting script and argument without reserved....');
  // const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  // const SEPath = `15328000002C${params.COIN_TYPE}8000000000000000${addressIdxHex}`;
  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;

  const script =
    // '03040E01C7070000000332A00700C2A0D700FFFFCAA1C70008C2ACD70009FFFCA00700CAAC27000DC2ACD70021FFE0CAAC970041BE0710C2ADD7002750FFFFC2ADD7002751FFF8CAAD57002759C2ADD7002779FFF8BE0710DC07C003564554D207CC05065052455353425554546F4E' +
    '03000E01C7070000000332CC07C002F800C2A0D700FFFFCAA1C70008C2ACD70009FFFCCC071094CAAC27000DC2ACD70021FFE0CAAC970041C2ADD7002750FFFFC2ADD7002751FFF8CAAD57002759C2ADD7002779FFF8DC07C003564554DAACD7C021FFE012D207CC05065052455353425554546F4E' +
    params.TRANSFER.signature;
  const argument = getTransferArgument(transaction);
  const finalArgument = SEPath + argument;
  console.log({ script, finalArgument });
  return {
    script,
    argument: SEPath + argument,
  };
};