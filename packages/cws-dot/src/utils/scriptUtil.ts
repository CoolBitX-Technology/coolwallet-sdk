import * as types from '../config/types'
import { utils } from '@coolwallet/core';
import * as params from '../config/params'
import * as stringUtil from './stringUtil'


async function addPath(argument: string, addressIndex: number, coinType: string) {
  const SEPath = `15${await utils.getPath(coinType, addressIndex)}`;
  return SEPath + argument;
}

/**
 * 
 * @param rawData 
 * @returns 
 */
const getTradeArgument = async (rawData: types.FormatTransfer)
  : Promise<string> => {
  const mortalEra = rawData.mortalEra.padStart(10, '0')
  const nonce = stringUtil.removeHex0x(rawData.nonce).padStart(10, '0')
  const tip = rawData.tip.padStart(10, '0')
  const specVer = rawData.specVer.padStart(8, '0')
  const txVer = rawData.txVer.padStart(8, '0')
  const blockHash = stringUtil.removeHex0x(rawData.blockHash).padStart(64, '0')
  const genesisHash = stringUtil.removeHex0x(rawData.genesisHash).padStart(64, '0')

  const argument = mortalEra + nonce + tip + specVer + txVer + genesisHash + blockHash
  return argument;
};


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
export const getNormalArgument = async (rawData: types.FormatTransfer, method: types.FormatNormalMethod, addressIndex: number, coinType: string)
  : Promise<string> => {

  // const methodLen = dotUtil.getMethodLength(methodString).padStart(4, '0')
  const callIndex = method.callIndex.padStart(4, '0')
  const destAddress = method.destAddress.padStart(64, '0')
  const value = method.value.padStart(20, '0')
  const tradeArgument = await getTradeArgument(rawData)

  console.log("callIndex: ", callIndex)
  console.log("destAddress: ", destAddress)
  console.log("value: ", value)
  // const argument = methodLen + callIndex + destAddress + value + tradeArgument
  const argument = callIndex + destAddress + value + tradeArgument
  console.debug('NormalTradeArgument: ', argument)
  return addPath(argument, addressIndex, coinType);
};


export const getBondArgument = async (rawData: types.FormatTransfer, method: types.FormatBondMethod, addressIndex: number, coinType: string)
  : Promise<string> => {

  const callIndex = method.callIndex.padStart(4, '0')
  const controllerAddress = method.controllerAddress.padStart(64, '0')
  const value = method.value.padStart(20, '0')
  const payeeType = method.payeeType
  const tradeArgument = await getTradeArgument(rawData)

  const argument = callIndex + controllerAddress + value + payeeType + tradeArgument
  console.debug('BondArgument: ', argument)
  return addPath(argument, addressIndex, coinType);
};

/**
 * 
 * @param rawData 
 * @param method 
 * @param addressIndex 
 * @returns 
 */
export const getBondExtraArgument = async (rawData: types.FormatTransfer, method: types.FormatBondExtraMethod, addressIndex: number, coinType: string)
  : Promise<string> => {

  const callIndex = method.callIndex.padStart(4, '0')
  const maxAdditional = method.maxAdditional.padStart(20, '0')
  const tradeArgument = await getTradeArgument(rawData)

  const argument = callIndex + maxAdditional + tradeArgument
  console.debug('BondExtraArgument: ', argument)
  return addPath(argument, addressIndex, coinType);
};

/**
 * 
 * @param rawData 
 * @param method 
 * @param addressIndex 
 * @returns 
 */
export const getUnbondArgument = async (rawData: types.FormatTransfer, method: types.FormatUnbondMethod, addressIndex: number, coinType: string)
  : Promise<string> => {

  const callIndex = method.callIndex.padStart(4, '0')
  const value = method.value.padStart(20, '0')
  const tradeArgument = await getTradeArgument(rawData)
  const argument = callIndex + value + tradeArgument
  console.debug('UnbondArgument: ', argument)
  return addPath(argument, addressIndex, coinType);
};

/**
 * Argument = [callIndex (2B)][tradeArgument][targetCount (1B)][targets (Variety)]
 * @param rawData 
 * @param method 
 * @param addressIndex 
 * @returns 
 */
export const getNominateArgument = async (rawData: types.FormatTransfer, method: types.FormatNominateMethod, addressIndex: number, coinType: string)
  : Promise<string> => {

  const callIndex = method.callIndex.padStart(4, '0')
  const targetCount = method.addressCount.padStart(2, '0')
  const targets = method.targetsString
  const tradeArgument = await getTradeArgument(rawData)

  const argument = callIndex + tradeArgument + targetCount + targets
  console.debug('NominateArgument: ', argument)
  return addPath(argument, addressIndex, coinType);
};

//  TODO
export const getWithdrawUnbondedArgument = async (rawData: types.FormatTransfer, method: types.FormatWithdrawUnbondedTxMethod, addressIndex: number, coinType: string)
  : Promise<string> => {

  const callIndex = method.callIndex.padStart(4, '0')
  const numSlashingSpans = method.numSlashingSpans.padStart(8, '0')
  console.debug("numSlashingSpans: ", numSlashingSpans)
  const tradeArgument = await getTradeArgument(rawData)

  const argument = callIndex + numSlashingSpans + tradeArgument
  console.debug('WithdrawUnbondedArgument: ', argument)
  return addPath(argument, addressIndex, coinType);
};
