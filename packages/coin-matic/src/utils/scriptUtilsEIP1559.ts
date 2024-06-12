import { utils } from '@coolwallet/core';
import { EIP1559Transaction } from '../config/types';
import { COIN_TYPE } from '../config/params';
import * as token from './tokenUtils';
import { handleHex } from './stringUtil';

/**
 * [toAddress(20B)]  81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C
 * [value(10B)]      000000b1a2bc2ec50000
 * [gasTipCap(10B)]  00000000000000000001
 * [gasFeeCap(10B)]  000000000000000000ff
 * [gasLimit(10B)]   0000000000000000520c
 * [nonce(8B)]       0000000000000289
 */
export const getTransferArgument = async (transaction: EIP1559Transaction, addressIndex: number): Promise<string> => {
  const argument =
    handleHex(transaction.to) +
    handleHex(transaction.value).padStart(20, '0') +
    handleHex(transaction.gasTipCap).padStart(20, '0') +
    handleHex(transaction.gasFeeCap).padStart(20, '0') +
    handleHex(transaction.gasLimit).padStart(20, '0') +
    handleHex(transaction.nonce).padStart(16, '0');

  const path = await utils.getPath(COIN_TYPE, addressIndex);
  return `15${path}${argument}`;
};

/**
 * [toAddress(20B)]
 * [amount(12B)]
 * [gasTipCap(10B)]
 * [gasFeeCap(10B)]
 * [gasLimit(10B)]
 * [nonce(8B)]
 * [tokenDecimal(1B)]
 * [tokenNameLength(1B)]
 * [tokenName(7B,leftJustified)]
 * [tokenContractAddress(20B)]
 * [tokenSignature(72B)]
 */
export const getERC20Argument = async (
  transaction: EIP1559Transaction,
  tokenSignature: string,
  addressIndex: number
): Promise<string> => {
  const symbol = transaction.option?.info?.symbol ?? '';
  const decimals = transaction.option?.info?.decimals ?? '';
  const tokenInfo = token.getSetTokenPayload(transaction.to, symbol, parseInt(decimals, 10));
  const signature = tokenSignature.slice(58).padStart(144, '0');
  const toAddress = transaction.data.slice(10, 74).replace(/\b(0+)/gi, '');
  const amount = transaction.data.slice(74).replace(/\b(0+)/gi, '');
  const argument =
    handleHex(toAddress).padStart(40, '0') +
    handleHex(amount).padStart(24, '0') +
    handleHex(transaction.gasTipCap).padStart(20, '0') +
    handleHex(transaction.gasFeeCap).padStart(20, '0') +
    handleHex(transaction.gasLimit).padStart(20, '0') +
    handleHex(transaction.nonce).padStart(16, '0') +
    tokenInfo +
    signature;

  const path = await utils.getPath(COIN_TYPE, addressIndex);
  return `15${path}${argument}`;
};

/**
 * [contractAddress(20B)]
 * [value(10B)]
 * [gasTipCap(10B)]
 * [gasFeeCap(10B)]
 * [gasLimit(10B)]
 * [nonce(8B)]
 * [contractData(Variety)]
 */
export const getSmartArgument = async (transaction: EIP1559Transaction, addressIndex: number): Promise<string> => {
  const argument =
    handleHex(transaction.to) +
    handleHex(transaction.value).padStart(20, '0') +
    handleHex(transaction.gasTipCap).padStart(20, '0') +
    handleHex(transaction.gasFeeCap).padStart(20, '0') +
    handleHex(transaction.gasLimit).padStart(20, '0') +
    handleHex(transaction.nonce).padStart(16, '0') +
    handleHex(transaction.data);

  const path = await utils.getPath(COIN_TYPE, addressIndex);
  return `15${path}${argument}`;
};

/**
 * [contractAddress(20B)]
 * [value(10B)]
 * [gasTipCap(10B)]
 * [gasFeeCap(10B)]
 * [gasLimit(10B)]
 * [nonce(8B)]
 * [dataLength(4B)]
 */
export const getSmartArgumentSegment = async (
  transaction: EIP1559Transaction,
  addressIndex: number
): Promise<string> => {
  const argument =
    handleHex(transaction.to) +
    handleHex(transaction.value).padStart(20, '0') +
    handleHex(transaction.gasTipCap).padStart(20, '0') +
    handleHex(transaction.gasFeeCap).padStart(20, '0') +
    handleHex(transaction.gasLimit).padStart(20, '0') +
    handleHex(transaction.nonce).padStart(16, '0') +
    (handleHex(transaction.data).length / 2).toString(16).padStart(8, '0'); // data length

  const path = await utils.getPath(COIN_TYPE, addressIndex);
  return `15${path}${argument}`;
};
