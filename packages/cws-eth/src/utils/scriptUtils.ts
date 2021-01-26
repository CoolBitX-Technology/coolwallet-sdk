import { Option } from '../config/type'
import { COIN_TYPE } from '../config/param'
import * as token from "./tokenUtils";
import { utils } from '@coolwallet/core';
import { handleHex } from "./stringUtil";
import { Transaction } from '../config/type';
const Web3 = require('web3');

export const getPath = async (addressIndex: number) => {
  let path = utils.getPath(COIN_TYPE, addressIndex)
  path = path.length.toString(16) + path
  return path
};

/**
 * [toAddress(20B)] [amount(10B)] [gasPrice(10B)] [gasLimit(10B)] [nonce(8B)] [chainId(2B)]
 * @param transaction 
 */
export const getTransferArgument = (transaction: Transaction, addressIndex: number) => {
  const argument =
    handleHex(transaction.to) + // 81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C
    handleHex(transaction.value).padStart(20, "0") + // 000000b1a2bc2ec50000
    handleHex(transaction.gasPrice).padStart(20, "0") + // 0000000000020c855800
    handleHex(transaction.gasLimit).padStart(20, "0") + // 0000000000000000520c
    handleHex(transaction.nonce).padStart(16, "0") + // 0000000000000289
    handleHex(transaction.chainId.toString(16)).padStart(4, "0"); // 0001

  console.log('path: ' + getPath(addressIndex))
  return getPath(addressIndex) + argument;
};

/**
 * [toAddress(20B)] [amount(12B)] [gasPrice(10B)] [gasLimit(10B)] [nonce(8B)] [chainId(2B)] [tokenDecimal(1B)] [tokenNameLength(1B)] [tokenName(7B,leftJustified)] [tokenContractAddress(20B)] [tokenSignature(72B)]
 * @param transaction 
 * @param tokenSignature 
 */
export const getERC20Argument = (transaction: Transaction, tokenSignature: string, addressIndex: number) => {

  const txTokenInfo: Option = transaction.option;
  const tokenInfo = token.getSetTokenPayload(transaction.to, txTokenInfo.info.symbol, parseInt(txTokenInfo.info.decimals));
  const signature = tokenSignature.slice(58).padStart(144, "0");
  const toAddress = transaction.data.slice(10, 74).replace(/\b(0+)/gi, "");
  const amount = transaction.data.slice(74).replace(/\b(0+)/gi, "");
  const argument =
    handleHex(toAddress) + // toAddress
    handleHex(amount).padStart(24, "0") + // 000000b1a2bc2ec50000
    handleHex(transaction.gasPrice).padStart(20, "0") + // 0000000000020c855800
    handleHex(transaction.gasLimit).padStart(20, "0") + // 0000000000000000520c
    handleHex(transaction.nonce).padStart(16, "0") + // 0000000000000289
    handleHex(transaction.chainId.toString(16)).padStart(4, "0") + // 0001
    tokenInfo +
    signature;

  return getPath(addressIndex) + argument;
};


/**
 * [contractAddress(20B)] [value(10B)] [gasPrice(10B)] [gasLimit(10B)] [nonce(8B)] [chainId(2B)] [contractData(Variety)]
 * @param transaction 
 */
export const getSmartContractArgument = (transaction: Transaction, addressIndex: number) => {
  const argument =
    handleHex(transaction.to) + // contractAddress : 81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C
    handleHex(transaction.value).padStart(20, "0") + // 000000b1a2bc2ec50000
    handleHex(transaction.gasPrice).padStart(20, "0") + // 0000000000020c855800
    handleHex(transaction.gasLimit).padStart(20, "0") + // 0000000000000000520c
    handleHex(transaction.nonce).padStart(16, "0") + // 0000000000000289
    handleHex(transaction.chainId.toString(16)).padStart(4, "0") + // 0001
    handleHex(transaction.data) // limit of data length : 1208Byte

  return getPath(addressIndex) + argument;
};


/**
 * [message(Variety)]
 * @param transaction 
 */
export const getSignMessageArgument = (message: string, addressIndex: number) => {
  const argument =
    handleHex(Web3.utils.toHex(message))
  return getPath(addressIndex) + argument;
};

/**
 * [domainSeparator(32B)] [data(Variety)]
 * @param transaction 
 */
export const getSignTypedDataArgument = (domainSeparator: string, data: string, addressIndex: number) => {
  
  const argument =
    handleHex(domainSeparator).padStart(64, "0") +
    handleHex(data)
  return getPath(addressIndex) + argument;
};
