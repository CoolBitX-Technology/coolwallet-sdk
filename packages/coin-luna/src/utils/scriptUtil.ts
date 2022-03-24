import * as params from '../config/params';
import * as types from '../config/types';

export function getLunaSendArgument(publicKey: string, lunaData: types.MsgSend, addressIndex: number) {
  const pubKey = publicKey.padStart(66, '0');
  const from = Buffer.from(lunaData.fromAddress, 'ascii').toString('hex').padStart(128, '0');
  const to = Buffer.from(lunaData.toAddress, 'ascii').toString('hex').padStart(128, '0');
  const amount = lunaData.amount.toString(16).padStart(16, '0');
  const feeAmount = lunaData.feeAmount.toString(16).padStart(16, '0');
  const gas = lunaData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(lunaData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(lunaData.sequence).toString(16).padStart(16, '0');
  const memo = Buffer.from(lunaData.memo, 'ascii').toString('hex');

  const argument = pubKey + from + to + amount + feeAmount + gas + accountNumber + sequence + memo;

  console.debug('getLunaSendArgument: ' + argument);

  return addPath(argument, addressIndex);
}

/**
 * Get Luna Delegate Or Undelegate Argument
 * @param lunaData
 * @param addressIndex
 */
export function getLunaDelgtOrUnDelArgument(publicKey: string, lunaData: types.MsgDelegate, addressIndex: number) {
  const pubKey = publicKey.padStart(66, '0');
  const delegatorAddress = Buffer.from(lunaData.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const validatorAddress = Buffer.from(lunaData.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const amount = lunaData.amount.toString(16).padStart(16, '0');
  const feeAmount = lunaData.feeAmount.toString(16).padStart(16, '0');
  const gas = lunaData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(lunaData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(lunaData.sequence).toString(16).padStart(16, '0');
  const memo = Buffer.from(lunaData.memo, 'ascii').toString('hex');

  const argument =
    pubKey + delegatorAddress + validatorAddress + amount + feeAmount + gas + accountNumber + sequence + memo;

  console.debug('getLunaDelgtOrUnDelArgument: ' + argument);

  return addPath(argument, addressIndex);
}

export function getLunaWithdrawArgument(
  publicKey: string,
  lunaData: types.MsgWithdrawDelegationReward,
  addressIndex: number
) {
  const pubKey = publicKey.padStart(66, '0');
  const delegatorAddress = Buffer.from(lunaData.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const validatorAddress = Buffer.from(lunaData.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const feeAmount = lunaData.feeAmount.toString(16).padStart(16, '0');
  const gas = lunaData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(lunaData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(lunaData.sequence).toString(16).padStart(16, '0');
  const memo = Buffer.from(lunaData.memo, 'ascii').toString('hex');

  const argument = pubKey + delegatorAddress + validatorAddress + feeAmount + gas + accountNumber + sequence + memo;

  console.debug('getLunaWithdrawArgument: ' + argument);

  return addPath(argument, addressIndex);
}

export function getLunaSmartArgument(publicKey: string, lunaData: types.MsgExecuteContract, addressIndex: number) {
  const pubKey = publicKey.padStart(66, '0');
  const senderAddress = Buffer.from(lunaData.senderAddress, 'ascii').toString('hex').padStart(128, '0');
  const contractAddress = Buffer.from(lunaData.contractAddress, 'ascii').toString('hex').padStart(128, '0');
  let fundsDenom = ''.padStart(16, '0');
  let fundsAmount = ''.padStart(16, '0');
  if (lunaData.funds !== undefined) {
    fundsDenom = Buffer.from(lunaData.funds.denom, 'ascii').toString('hex').padStart(16, '0');
    fundsAmount = lunaData.funds.amount.toString(16).padStart(16, '0');
  }
  const feeAmount = lunaData.feeAmount.toString(16).padStart(16, '0');
  const gas = lunaData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(lunaData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(lunaData.sequence).toString(16).padStart(16, '0');
  const memo = Buffer.from(lunaData.memo, 'ascii').toString('hex').padStart(256, '0');
  const execute_msg = Buffer.from(lunaData.execute_msg).toString('hex');

  const argument =
    pubKey +
    senderAddress +
    contractAddress +
    fundsDenom +
    fundsAmount +
    feeAmount +
    gas +
    accountNumber +
    sequence +
    memo +
    execute_msg;

  console.debug('getLunaSmartArgument: ' + argument);

  return addPath(argument, addressIndex);
}

function addPath(argument: string, addressIndex: number) {
  const addressIdxHex = '00'.concat(addressIndex.toString(16).padStart(6, '0'));
  const SEPath = `15328000002C${params.COIN_TYPE}8000000000000000${addressIdxHex}`;
  console.debug('SEPath: ' + SEPath);
  return SEPath + argument;
}
