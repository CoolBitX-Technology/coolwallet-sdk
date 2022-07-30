import { utils } from '@coolwallet/core';
import * as params from '../config/params';
import * as types from '../config/types';
import * as stringUtil from './stringUtil';

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

  const data = stringUtil.handleHex(clause.data);

  const gasPriceCoef = stringUtil.handleHex(transaction.gasPriceCoef.toString()).padStart(2, '0');

  const gas = stringUtil.handleHex(transaction.gas.toString()).padStart(16, '0');

  const dependsOn = stringUtil.handleHex(transaction.dependsOn).padStart(64, '0');
  

  const nonce = stringUtil.handleHex(transaction.nonce).padStart(16, '0');

  const argument = chainTag+blockRef+expiration+to+value+data+gasPriceCoef+gas+dependsOn+nonce;
  console.log("argument: ", argument)
  
  return argument;
};

/**
 * @param {number} addressIndex
 * @param {*} transaction
 */
export const getScriptAndArguments = async (addressIndex: number, transaction: types.Record) => {
  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;

  const script =
    // '03040E01C7070000000332A00700C2A0D700FFFFC2A1D700FFF8C2ACD70009FFFCA00700A00700CC071094CAAC27000DC2ACD70021FFE0C2ACC7004106BE0710BE0710CC071081CAACD70047FFFFC2ACD70048FFF81AAC57C050080000000000000000000000000000000000000000000000000000000000000000CC0710801507C005C2AC570050C2ACD70070FFF8CC0710c0BE0710DC07C003564554CC0FC0023078BAAC2F6C0D0E04DDF09700DAACD7C021FFE012D207CC05065052455353425554546F4E' +
    params.TRANSFER.script +
    params.TRANSFER.signature;
  const argument = getTransferArgument(transaction);
  return {
    script,
    argument: SEPath + argument,
  };
};