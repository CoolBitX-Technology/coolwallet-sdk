import BigNumber from 'bignumber.js';
import { utils } from '@coolwallet/core';
import * as param from '../config/params';
import {
	NormalContract,
	FreezeContract,
	UnfreezeContract,
	VoteWitnessContract,
	WithdrawBalanceContract
} from '../config/types';

const numberToHex = (num: number|string): string => {
	const tBN = new BigNumber(num);
	return tBN.toString(16).padStart(20, '0');
};


export const getNormalTradeArgument = async (rawData: NormalContract, addressIndex: number)
	: Promise<string> => {
	const {
		refBlockBytes,
		refBlockHash,
		expiration,
		timestamp,
		contract
	} = rawData;
	const {
		ownerAddress,
		toAddress,
		amount
	} = contract;
	const argument = refBlockBytes + refBlockHash + numberToHex(expiration)
		+ ownerAddress + toAddress + numberToHex(amount) + numberToHex(timestamp);

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
) : Promise<string> => {
	const {
		refBlockBytes,
		refBlockHash,
		expiration,
		timestamp,
		contract
	} = rawData;
	const {
		ownerAddress,
		receiverAddress,
		frozenBalance,
		frozenDuration,
		resource
	} = contract;
	const argument = refBlockBytes + refBlockHash + numberToHex(expiration) + ownerAddress
		+ numberToHex(frozenBalance) + numberToHex(frozenDuration) + resource
		+ (hasReceiver ? receiverAddress : '') + numberToHex(timestamp);

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
) : Promise<string> => {
	const {
		refBlockBytes,
		refBlockHash,
		expiration,
		timestamp,
		contract
	} = rawData;
	const {
		ownerAddress,
		receiverAddress,
		resource
	} = contract;
	const argument = refBlockBytes + refBlockHash + numberToHex(expiration) + ownerAddress
		+ resource + (hasReceiver ? receiverAddress : '') + numberToHex(timestamp);

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
export const getVoteWitnessArgument = async (rawData: VoteWitnessContract, addressIndex: number)
	: Promise<string> => {
	const {
		refBlockBytes,
		refBlockHash,
		expiration,
		timestamp,
		contract
	} = rawData;
	const {
		ownerAddress,
		voteAddress,
		voteCount
	} = contract;
	const argument = refBlockBytes + refBlockHash + numberToHex(expiration)
			+ ownerAddress + voteAddress + numberToHex(voteCount) + numberToHex(timestamp);

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
) : Promise<string> => {
	const {
		refBlockBytes,
		refBlockHash,
		expiration,
		timestamp,
		contract
	} = rawData;
	const { ownerAddress } = contract;
	const argument = refBlockBytes + refBlockHash + numberToHex(expiration)
			+ ownerAddress + numberToHex(timestamp);

	return addPath(argument, addressIndex);
};

async function addPath(argument: string, addressIndex: number) {
	const SEPath = `15${await utils.getPath(param.COIN_TYPE, addressIndex)}`;
	return SEPath + argument;
}
