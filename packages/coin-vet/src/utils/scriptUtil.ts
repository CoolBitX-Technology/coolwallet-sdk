import { utils } from '@coolwallet/core';
import * as params from "../config/params";
import * as stringUtil from "./stringUtil";


const getTransferArgument = (transaction: any) => {
  const tx = JSON.parse(transaction);
  const argument =
    stringUtil.handleHex(tx.from).slice(2) +
    stringUtil.handleHex(tx.to).slice(2) +
    stringUtil.handleHex(tx.value).padStart(20, "0") +
    stringUtil.handleHex(tx.timestamp).padStart(20, "0") +
    stringUtil.handleHex(tx.nid.toString(16)).padStart(4, "0");
  return argument;
};
/**
 * @param {number} addressIndex
 * @param {*} transaction
 */
export const getScriptAndArguments = async (addressIndex: number, transaction: object) => {
  // const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  // const SEPath = `15328000002C${params.COIN_TYPE}8000000000000000${addressIdxHex}`;
  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;
  
  const script = params.TRANSFER.script + params.TRANSFER.signature;
  const argument = getTransferArgument(transaction);

  return {
    script,
    argument: SEPath + argument,
  };
};


