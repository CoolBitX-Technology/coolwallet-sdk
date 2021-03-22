import * as types from '../config/types'
import { utils } from '@coolwallet/core';
import * as params from '../config/params'
import * as dotUtil from './dotUtil'
const { decodeAddress } = require('@polkadot/keyring');


async function addPath(argument: string, addressIndex: number) {
  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;
  return SEPath + argument;
}


/**
payload:
0xb0
0500   call index(pallet + name)
00     ??
8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48   dest address
13f6ffffffffff3f01   value
770e   MortalEra = format(block num + eraPeriod)
84     nonce
58     tip
9a020000     spec ver
4d010000     tx ver
91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3   block hash
5c697847b25d385178aa150d29e5ce212339c5624183f74bdf45f4912c89749a   genesis hash
 * @param rawData 
 * @param addressIndex 
 * @returns 
 */
export const getNormalTradeArgument = async (rawData: types.FormatTransfer, method: types.FormatNormalMethod, methodString: string, addressIndex: number)
  : Promise<string> => {
    
  const methodLen = dotUtil.getMethodLength(methodString)
  const callIndex = method.callIndex
  const destAddress = method.destAddress
  const value = method.value
  const mortalEra = rawData.mortalEra
  const nonce = rawData.nonce
  const tip = rawData.tip
  const specVer = rawData.specVer
  const txVer = rawData.txVer
  const blockHash = rawData.blockHash
  const genesisHash = rawData.genesisHash

  const argument = methodLen + callIndex + destAddress + value + mortalEra + nonce + tip + specVer + txVer + blockHash + genesisHash
  return addPath(argument, addressIndex);
};

// TODO
export const getBondArgument = async (rawData: types.FormatTransfer, method: types.FormatBondMethod, methodString: string, addressIndex: number)
  : Promise<string> => {

  const methodLen = dotUtil.getMethodLength(methodString)
  const callIndex = method.callIndex
  const controllerAddress = method.controllerAddress
  const value = method.value
  const mortalEra = rawData.mortalEra
  const nonce = rawData.nonce
  const tip = rawData.tip
  const specVer = rawData.specVer
  const txVer = rawData.txVer
  const blockHash = rawData.blockHash
  const genesisHash = rawData.genesisHash

  const argument = methodLen + callIndex + controllerAddress + value + mortalEra + nonce + tip + specVer + txVer + blockHash + genesisHash
  return addPath(argument, addressIndex);
};

// TODO
export const getUnbondArgument = async (rawData: types.FormatTransfer, method: types.FormatUnbondMethod, methodString: string, addressIndex: number)
  : Promise<string> => {

  const methodLen = dotUtil.getMethodLength(methodString)
  const value = method.value
  const mortalEra = rawData.mortalEra
  const nonce = rawData.nonce
  const tip = rawData.tip
  const specVer = rawData.specVer
  const txVer = rawData.txVer
  const blockHash = rawData.blockHash
  const genesisHash = rawData.genesisHash

  const argument = methodLen + value + mortalEra + nonce + tip + specVer + txVer + blockHash + genesisHash
  return addPath(argument, addressIndex);
};

//  TODO
export const getNominateArgument = async (rawData: types.FormatTransfer, method: types.FormatNominateMethod, methodString: string, addressIndex: number)
  : Promise<string> => {

  const methodLen = dotUtil.getMethodLength(methodString)
  const target = method.targetAddress
  const mortalEra = rawData.mortalEra
  const nonce = rawData.nonce
  const tip = rawData.tip
  const specVer = rawData.specVer
  const txVer = rawData.txVer
  const blockHash = rawData.blockHash
  const genesisHash = rawData.genesisHash

  const argument = methodLen + target + mortalEra + nonce + tip + specVer + txVer + blockHash + genesisHash
  return addPath(argument, addressIndex);
};
