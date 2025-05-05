import * as params from '../config/params';
import * as types from '../config/types';

function addPath(argument: string, addressIndex: number) {
  const addressIdxHex = '00'.concat(addressIndex.toString(16).padStart(6, '0'));
  const SEPath = `15328000002C${params.COIN_TYPE}8000000000000000${addressIdxHex}`;
  console.debug('SEPath: ' + SEPath);
  return SEPath + argument;
}

export function getCosmosSendArgement(publicKey: string, cosmosData: types.MsgSend, addressIndex: number) {
  const pubKey = publicKey.padStart(66, '0');
  const from = Buffer.from(cosmosData.fromAddress, 'ascii').toString('hex').padStart(128, '0');
  const to = Buffer.from(cosmosData.toAddress, 'ascii').toString('hex').padStart(128, '0');
  const amount = cosmosData.amount.toString(16).padStart(16, '0');
  const feeAmount = cosmosData.feeAmount.toString(16).padStart(16, '0');
  const gas = cosmosData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(cosmosData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(cosmosData.sequence).toString(16).padStart(16, '0');
  const memo = Buffer.from(cosmosData.memo, 'ascii').toString('hex');

  const argument = pubKey + from + to + amount + feeAmount + gas + accountNumber + sequence + memo;

  console.debug('getCosmosSendArgement: ' + argument);

  return addPath(argument, addressIndex);
}

/**
 * Get Cosmos Delegate Or Undelegate Argement
 * @param cosmosData
 * @param addressIndex
 */
export function getCosmosDelgtOrUnDelArgement(publicKey: string, cosmosData: types.MsgDelegate, addressIndex: number) {
  const pubKey = publicKey.padStart(66, '0');
  const delegatorAddress = Buffer.from(cosmosData.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const validatorAddress = Buffer.from(cosmosData.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const amount = cosmosData.amount.toString(16).padStart(16, '0');
  const feeAmount = cosmosData.feeAmount.toString(16).padStart(16, '0');
  const gas = cosmosData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(cosmosData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(cosmosData.sequence).toString(16).padStart(16, '0');
  const memo = Buffer.from(cosmosData.memo, 'ascii').toString('hex');

  const argument =
    pubKey + delegatorAddress + validatorAddress + amount + feeAmount + gas + accountNumber + sequence + memo;

  console.debug('getCosmosDelgtOrUnDelArgement: ' + argument);

  return addPath(argument, addressIndex);
}

export function getCosmosWithdrawArgement(
  publicKey: string,
  cosmosData: types.MsgWithdrawDelegationReward,
  addressIndex: number
) {
  const pubKey = publicKey.padStart(66, '0');
  const delegatorAddress = Buffer.from(cosmosData.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const validatorAddress = Buffer.from(cosmosData.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const feeAmount = cosmosData.feeAmount.toString(16).padStart(16, '0');
  const gas = cosmosData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(cosmosData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(cosmosData.sequence).toString(16).padStart(16, '0');
  const memo = Buffer.from(cosmosData.memo, 'ascii').toString('hex');

  const argument = pubKey + delegatorAddress + validatorAddress + feeAmount + gas + accountNumber + sequence + memo;

  console.debug('getCosmosWithdrawArgement: ' + argument);

  return addPath(argument, addressIndex);
}
