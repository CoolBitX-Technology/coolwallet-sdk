import { Option } from '../config/types';
import { COIN_TYPE } from '../config/params';
import * as token from './tokenUtils';
import { utils } from '@coolwallet/core';
import { handleHex } from './stringUtil';
import { Transaction } from '../config/types';
import Web3Utils from 'web3-utils';

/**
 * [toAddress(20B)] [amount(10B)] [gasPrice(10B)] [gasLimit(10B)] [nonce(8B)] [chainId(2B)]
 * @param transaction
 */
export const getTransferArgument = async (transaction: Transaction, addressIndex: number) => {
  const argument =
    handleHex(transaction.to) + // 81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C
    handleHex(transaction.value).padStart(20, '0') + // 000000b1a2bc2ec50000
    handleHex(transaction.gasPrice).padStart(20, '0') + // 0000000000020c855800
    handleHex(transaction.gasLimit).padStart(20, '0') + // 0000000000000000520c
    handleHex(transaction.nonce).padStart(16, '0') + // 0000000000000289
    handleHex(Number(137).toString(16)).padStart(10, '0');

  const path = await utils.getPath(COIN_TYPE, addressIndex);

  return '15' + path + argument;
};

/**
 * [toAddress(20B)] [amount(12B)] [gasPrice(10B)] [gasLimit(10B)] [nonce(8B)] [chainId(2B)] [tokenDecimal(1B)] [tokenNameLength(1B)] [tokenName(7B,leftJustified)] [tokenContractAddress(20B)] [tokenSignature(72B)]
 * @param transaction
 * @param tokenSignature
 */
export const getERC20Argument = async (transaction: Transaction, tokenSignature: string, addressIndex: number) => {
  const txTokenInfo = transaction.option;
  const tokenInfo = token.getSetTokenPayload(
    transaction.to,
    txTokenInfo?.info?.symbol ?? '',
    parseInt(txTokenInfo?.info?.decimals ?? '')
  );
  const signature = tokenSignature.slice(58).padStart(144, '0');
  const toAddress = transaction.data.slice(10, 74).replace(/\b(0+)/gi, '');
  const amount = transaction.data.slice(74).replace(/\b(0+)/gi, '');
  const argument =
    handleHex(toAddress).padStart(40, '0') + // toAddress
    handleHex(amount).padStart(24, '0') + // 000000b1a2bc2ec50000
    handleHex(transaction.gasPrice).padStart(20, '0') + // 0000000000020c855800
    handleHex(transaction.gasLimit).padStart(20, '0') + // 0000000000000000520c
    handleHex(transaction.nonce).padStart(16, '0') + // 0000000000000289
    tokenInfo +
    signature;

  return '15' + (await utils.getPath(COIN_TYPE, addressIndex)) + argument;
};

/**
 * [contractAddress(20B)] [value(10B)] [gasPrice(10B)] [gasLimit(10B)] [nonce(8B)] [contractData(Variety)]
 * @param transaction
 */
export const getSmartContractArgument = async (transaction: Transaction, addressIndex: number) => {
  const argument =
    handleHex(transaction.to) + // contractAddress : 81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C
    handleHex(transaction.value).padStart(20, '0') + // 000000b1a2bc2ec50000
    handleHex(transaction.gasPrice).padStart(20, '0') + // 0000000000020c855800
    handleHex(transaction.gasLimit).padStart(20, '0') + // 0000000000000000520c
    handleHex(transaction.nonce).padStart(16, '0') + // 0000000000000289
    handleHex(transaction.data); // data

  return '15' + (await utils.getPath(COIN_TYPE, addressIndex)) + argument;
};

/**
 * [contractAddress(20B)] [value(10B)] [gasPrice(10B)] [gasLimit(10B)] [nonce(8B)] [dataLength(4B)]
 * @param transaction
 */
export const getSmartContractArgumentSegment = async (transaction: Transaction, addressIndex: number) => {
  const argument =
    handleHex(transaction.to) + // contractAddress : 81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C
    handleHex(transaction.value).padStart(20, '0') + // 000000b1a2bc2ec50000
    handleHex(transaction.gasPrice).padStart(20, '0') + // 0000000000020c855800
    handleHex(transaction.gasLimit).padStart(20, '0') + // 0000000000000000520c
    handleHex(transaction.nonce).padStart(16, '0') + // 0000000000000289
    (handleHex(transaction.data).length / 2).toString(16).padStart(8, '0'); // data length

  return '15' + (await utils.getPath(COIN_TYPE, addressIndex)) + argument;
};

/**
 * [message(Variety)]
 * @param transaction
 */
export const getSignMessageArgument = async (message: string, addressIndex: number) => {
  const msgHex = handleHex(Web3Utils.toHex(message));
  const argument = Buffer.from((msgHex.length / 2).toString()).toString('hex') + msgHex;
  return '15' + (await utils.getPath(COIN_TYPE, addressIndex)) + argument;
};

/**
 * [domainSeparator(32B)] [data(Variety)]
 * @param transaction
 */
export const getSignTypedDataArgument = async (domainSeparator: string, data: string, addressIndex: number) => {
  const argument = handleHex(domainSeparator).padStart(64, '0') + handleHex(data);
  return '15' + (await utils.getPath(COIN_TYPE, addressIndex)) + argument;
};
