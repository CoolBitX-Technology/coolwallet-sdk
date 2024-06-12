import BigNumber from 'bignumber.js';
import { utils, error } from '@coolwallet/core';
import * as param from '../config/params';
import { TOKENTYPE } from '../config/tokenType';
import {
  NormalContract,
  FreezeContract,
  UnfreezeContract,
  VoteWitnessContract,
  WithdrawBalanceContract,
  TRC20TransferContract,
  UnfreezeContractV2,
  FreezeContractV2,
  WithdrawExpireUnfreezeContract,
  CancelAllUnfreezeContractV2,
} from '../config/types';

const sanitizeAddress = (address: string): string => {
  if (address.startsWith('41') && address.length === 42) {
    return address.slice(2);
  }
  throw new Error('The accepted address format is 21 bytes long and starts with "41"!!');
};

const removeHex0x = (hex: string): string => (hex.slice(0, 2) === '0x' ? hex.slice(2) : hex);
const evenHexDigit = (hex: string): string => (hex.length % 2 !== 0 ? `0${hex}` : hex);
const handleHex = (hex: string): string => evenHexDigit(removeHex0x(hex));

const getSetTokenPayload = (contractAddress: string, symbol: string, decimals: string): string => {
  const unit = handleHex(parseInt(decimals, 10).toString(16));
  const len = handleHex(symbol.length.toString(16));
  const symb = handleHex(Buffer.from(symbol).toString('hex'));
  const setTokenPayload = unit + len + symb.padEnd(14, '0') + removeHex0x(contractAddress);
  return setTokenPayload;
};

const addPath = async (argument: string, addressIndex: number): Promise<string> => {
  const SEPath = `15${await utils.getPath(param.COIN_TYPE, addressIndex)}`;
  return SEPath + argument;
};

const numberToHex = (num: number | string, pad = 20): string => {
  const tBN = new BigNumber(num);
  return tBN.toString(16).padStart(pad, '0');
};

export const getNormalTradeArgument = async (rawData: NormalContract, addressIndex: number): Promise<string> => {
  const { refBlockBytes, refBlockHash, expiration, timestamp, contract } = rawData;
  const { ownerAddress, toAddress, amount } = contract;
  const argument =
    refBlockBytes +
    refBlockHash +
    numberToHex(expiration) +
    ownerAddress +
    toAddress +
    numberToHex(amount) +
    numberToHex(timestamp);

  return addPath(argument, addressIndex);
};

/*
  = "db13" //ref_block_bytes
  + "c752a0b785e46fd5" //ref_block_hash
  + "0000000001768894C1B8" //expiration
  + "4194f71cd9c43718d3b03e62d648ba6d75f461a3bc" //owner_address
  + "000000000000000F4240" //frozen_balance
  + "00000000000000000003" //frozen_duration
  + "01" //resource
  + "41b9505137f37e1544eee2cd488413ee5cc6a0d0f0" //receiver_address
  + "0000000001768893DA8A"; //timestamp
*/
export const getFreezeArgument = async (
  rawData: FreezeContract,
  addressIndex: number,
  hasReceiver: boolean
): Promise<string> => {
  const { refBlockBytes, refBlockHash, expiration, timestamp, contract } = rawData;
  const { ownerAddress, receiverAddress, frozenBalance, frozenDuration, resource } = contract;
  const argument =
    refBlockBytes +
    refBlockHash +
    numberToHex(expiration) +
    ownerAddress +
    numberToHex(frozenBalance) +
    numberToHex(frozenDuration) +
    resource +
    (hasReceiver ? receiverAddress : '') +
    numberToHex(timestamp);

  return addPath(argument, addressIndex);
};

/**
  = "59d0" //ref_block_bytes
  + "7156f07a23657d0f" //ref_block_hash
  + "0000000001765F17C510" //expiration
  + "4194f71cd9c43718d3b03e62d648ba6d75f461a3bc" //owner_address
  + "01"//resource
  + "41b9505137f37e1544eee2cd488413ee5cc6a0d0f0" //receiver_address
  + "0000000001765F16E047"; //timestamp
 */
export const getUnfreezeArgument = async (
  rawData: UnfreezeContract,
  addressIndex: number,
  hasReceiver: boolean
): Promise<string> => {
  const { refBlockBytes, refBlockHash, expiration, timestamp, contract } = rawData;
  const { ownerAddress, receiverAddress, resource } = contract;
  const argument =
    refBlockBytes +
    refBlockHash +
    numberToHex(expiration) +
    ownerAddress +
    resource +
    (hasReceiver ? receiverAddress : '') +
    numberToHex(timestamp);

  return addPath(argument, addressIndex);
};

/**
    = "b4be" //ref_block_bytes
    + "ca7bcc139680b7cc" //ref_block_hash
    + "0000000001764B9F74B0" //expiration
    + "4194f71cd9c43718d3b03e62d648ba6d75f461a3bc" //owner_address
    + "41b9505137f37e1544eee2cd488413ee5cc6a0d0f0" //vote_address
    + "00000000000000000001" //vote_count
    + "0000000001764B9E8D43"; //timestamp
 */
export const getVoteWitnessArgument = async (rawData: VoteWitnessContract, addressIndex: number): Promise<string> => {
  const { refBlockBytes, refBlockHash, expiration, timestamp, contract } = rawData;
  const { ownerAddress, voteAddress, voteCount } = contract;
  const argument =
    refBlockBytes +
    refBlockHash +
    numberToHex(expiration) +
    ownerAddress +
    voteAddress +
    numberToHex(voteCount) +
    numberToHex(timestamp);

  return addPath(argument, addressIndex);
};

/**
  = "608f" //ref_block_bytes
  + "943f6f8f665827bb" //ref_block_hash
  + "0000000001764B9F74B0" //expiration
  + "4194f71cd9c43718d3b03e62d648ba6d75f461a3bc" //owner_address
  + "0000000001764B9E8D43"; //timestamp
 */
export const getWithdrawBalanceArgument = async (
  rawData: WithdrawBalanceContract,
  addressIndex: number
): Promise<string> => {
  const { refBlockBytes, refBlockHash, expiration, timestamp, contract } = rawData;
  const { ownerAddress } = contract;
  const argument = refBlockBytes + refBlockHash + numberToHex(expiration) + ownerAddress + numberToHex(timestamp);

  return addPath(argument, addressIndex);
};

function checkTokenInfo(transaction: TRC20TransferContract): {
  symbol: string;
  decimals: string;
  tokenSignature: string;
} {
  let { symbol, decimals } = (transaction.option && transaction.option.info) || {};

  // check if official token
  let contractAddress = sanitizeAddress(transaction.contract.contractAddress);
  contractAddress = contractAddress.toUpperCase();
  let tokenSignature = '';
  for (const tokenInfo of TOKENTYPE) {
    if (tokenInfo.contractAddress.toUpperCase() === contractAddress) {
      tokenSignature = tokenInfo.signature;
      symbol = tokenInfo.symbol;
      decimals = tokenInfo.decimals;
      break;
    }
  }

  // verify token info
  if (!symbol || !decimals) {
    throw new Error('Token symbol and decimals are required');
  }

  return { symbol, decimals, tokenSignature };
}

/**
 = "676c" //ref_block_bytes
 + "883b5f9ffa6af950" //ref_block_hash
 + "000000000178c3fb5df0" //expiration
 + "7946f66d0fc67924da0ac9936183ab3b07c81126" //owner_address
 + tokenInfo // argDecimal + argNameLength + argName + argContractAddr + argSign
 + "d148171f1ceeeb40d668c47d70e7e94e67977559" //to_address
 + "000000000000000000000064" //amount
 + "000000000178c3fa8184" //timestamp
 + "00000000000005f5e100";// fee_limit
 */
export const getTRC20Argument = async (transaction: TRC20TransferContract, addressIndex: number): Promise<string> => {
  const { refBlockBytes, refBlockHash, expiration, timestamp, contract, feeLimit } = transaction;

  const { symbol, decimals, tokenSignature } = checkTokenInfo(transaction);

  const ownerAddress = sanitizeAddress(contract.ownerAddress);
  const contractAddress = sanitizeAddress(contract.contractAddress);
  const receiverAddress = sanitizeAddress(contract.receiverAddress);

  const tokenInfo = getSetTokenPayload(contractAddress, symbol, decimals);
  const signature = tokenSignature.padStart(144, '0');
  const argument =
    refBlockBytes +
    refBlockHash +
    numberToHex(expiration) +
    ownerAddress +
    tokenInfo +
    signature +
    receiverAddress +
    numberToHex(contract.amount, 24) +
    numberToHex(timestamp) +
    numberToHex(feeLimit);

  return addPath(argument, addressIndex);
};

/*
  = "61a2" //ref_block_bytes
  + "952256953626c4dd" //ref_block_hash
  + "00000000018A221C8100" //expiration
  + "41ce8a0cf0c16d48bcf22825f6053248df653c89ca" //owner_address
  + "00000000000077359400" //frozen_balance
  + "01" //resource
  + "00000000018A221B9A50"; //timestamp
*/
export const getFreezeV2Argument = async (rawData: FreezeContractV2, addressIndex: number): Promise<string> => {
  const { refBlockBytes, refBlockHash, expiration, timestamp, contract } = rawData;
  const { ownerAddress, frozenBalance, resource } = contract;
  const argument =
    refBlockBytes +
    refBlockHash +
    numberToHex(expiration) +
    ownerAddress +
    numberToHex(frozenBalance) +
    resource +
    numberToHex(timestamp);

  return addPath(argument, addressIndex);
};

/**
	= "6454" //ref_block_bytes
	+ "5007c4e46764b163" //ref_block_hash
	+ "00000000018A223DB118" //expiration
	+ "41ce8a0cf0c16d48bcf22825f6053248df653c89ca" //owner_address
  + "000000000000000F4240" //unfrozen_balance
	+ "01"//resource
	+ "0000000001765F16E047"; //timestamp
   */
export const getUnfreezeV2Argument = async (rawData: UnfreezeContractV2, addressIndex: number): Promise<string> => {
  const { refBlockBytes, refBlockHash, expiration, timestamp, contract } = rawData;
  const { ownerAddress, unfrozenBalance, resource } = contract;
  const argument =
    refBlockBytes +
    refBlockHash +
    numberToHex(expiration) +
    ownerAddress +
    numberToHex(unfrozenBalance) +
    resource +
    numberToHex(timestamp);

  return addPath(argument, addressIndex);
};

/** 
= "0295" // ref_block_bytes
+ "adbe424e0aafb88d" // ref_block_hash
+ "00000000018AB16BBE98" // expiration
+ "41fb5c19f956a2bf76e7b3d0b25237eb39e37e1420" //owner_address
+ "00000000018AB16ADB40"; // timestamp
 */

export const getWithdrawExpireUnfreezeArgument = async (
  rawData: WithdrawExpireUnfreezeContract,
  addressIndex: number
): Promise<string> => {
  const { refBlockBytes, refBlockHash, expiration, timestamp, contract } = rawData;
  const { ownerAddress } = contract;
  const argument = refBlockBytes + refBlockHash + numberToHex(expiration) + ownerAddress + numberToHex(timestamp);

  return addPath(argument, addressIndex);
};

/**
= "cb63" // ref_block_bytes
+ "40949daa9e1a17dd" // ref_block_hash
+ "00000000018A688F1C60" // expiration
+ "41fb5c19f956a2bf76e7b3d0b25237eb39e37e1420" //owner_address
+ "00000000018A688E3BBE"; // timestamp
 */
export const getCancelAllUnfreezeV2Argument = async (
  rawData: CancelAllUnfreezeContractV2,
  addressIndex: number
): Promise<string> => {
  const { refBlockBytes, refBlockHash, expiration, timestamp, contract } = rawData;
  const { ownerAddress } = contract;
  const argument = refBlockBytes + refBlockHash + numberToHex(expiration) + ownerAddress + numberToHex(timestamp);

  return addPath(argument, addressIndex);
};
