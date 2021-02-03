
import * as params from "../config/params";
import * as types from "../config/types";



export function getCosmosSendArgement(cosmosData: types.MsgSend, addressIndex: number) {

  const from = Buffer.from(cosmosData.fromAddress, 'ascii').toString('hex').padStart(128, '0');
  const to = Buffer.from(cosmosData.toAddress, 'ascii').toString('hex').padStart(128, '0');
  const amount = cosmosData.amount.toString(16).padStart(16, '0');
  const feeAmount = cosmosData.feeAmount.toString(16).padStart(16, '0');
  const gas = cosmosData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(cosmosData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(cosmosData.sequence).toString(16).padStart(16, '0');
  const memo = Buffer.from(cosmosData.memo, 'ascii').toString('hex');

  const argument = from + to + amount + feeAmount + gas + accountNumber + sequence + memo;

  console.log("getCosmosSendArgement: " + argument)

  return addPath(argument, addressIndex);
}

/**
 * Get Cosmos Delegate Or Undelegate Argement
 * @param cosmosData 
 * @param addressIndex 
 */
export function getCosmosDelgtOrUnDelArgement(cosmosData: types.MsgDelegate, addressIndex: number) {

  const delegatorAddress = Buffer.from(cosmosData.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const validatorAddress = Buffer.from(cosmosData.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const amount = cosmosData.amount.toString(16).padStart(16, '0');
  const feeAmount = cosmosData.feeAmount.toString(16).padStart(16, '0');
  const gas = cosmosData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(cosmosData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(cosmosData.sequence).toString(16).padStart(16, '0');
  const memo = Buffer.from(cosmosData.memo, 'ascii').toString('hex');

  const argument = delegatorAddress + validatorAddress + amount + feeAmount + gas + accountNumber + sequence + memo;

  console.log("getCosmosDelgtOrUnDelArgement: " + argument)

  return addPath(argument, addressIndex);
}

export function getCosmosWithdrawArgement(cosmosData: types.MsgWithdrawDelegationReward, addressIndex: number) {

  const delegatorAddress = Buffer.from(cosmosData.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const validatorAddress = Buffer.from(cosmosData.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const feeAmount = cosmosData.feeAmount.toString(16).padStart(16, '0');
  const gas = cosmosData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(cosmosData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(cosmosData.sequence).toString(16).padStart(16, '0');
  const memo = Buffer.from(cosmosData.memo, 'ascii').toString('hex');

  const argument = delegatorAddress + validatorAddress + feeAmount + gas + accountNumber + sequence + memo;

  console.log("getCosmosWithdrawArgement: " + argument)

  return addPath(argument, addressIndex);
}

function addPath(argument: string, addressIndex: number) {
  const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  const SEPath = `15328000002C${params.COIN_TYPE}8000000000000000${addressIdxHex}`;
  console.log("SEPath: " + SEPath)
  return SEPath + argument;
}
