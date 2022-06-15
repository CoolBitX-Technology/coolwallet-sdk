import * as params from '../config/params';
import * as types from '../config/types';
import { getDenomFromFee } from './msgUtils';
import * as token from './tokenUtils';

function addPath(argument: string, addressIndex: number) {
  const addressIdxHex = '00'.concat(addressIndex.toString(16).padStart(6, '0'));
  const SEPath = `15328000002C${params.COIN_TYPE}8000000000000000${addressIdxHex}`;
  console.debug('SEPath: ' + SEPath);
  return SEPath + argument;
}

//TODO FIX:empty memo is handled as empty string, but TERRA SDK handeld it as undefined, causing invalid signature. 

export function getTerraSendArgument(publicKey: string, terraData: types.MsgSend, addressIndex: number) {
  const pubKey = publicKey.padStart(66, '0');
  const from = Buffer.from(terraData.fromAddress, 'ascii').toString('hex').padStart(128, '0');
  const to = Buffer.from(terraData.toAddress, 'ascii').toString('hex').padStart(128, '0');
  const amount = terraData.coin.amount.toString(16).padStart(16, '0');
  const feeAmount = terraData.fee.amount.toString(16).padStart(16, '0');
  const gas = terraData.fee.gas_limit.toString(16).padStart(16, '0');
  const accountNumber = parseInt(terraData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(terraData.sequence).toString(16).padStart(16, '0');
  const { coin, fee } = terraData;
  // Encoding amount denom
  const denomLabel = Buffer.from(coin.denom.name, 'ascii').toString('hex').padStart(16, '0');
  const denom = coin.denom.protoUnit.padStart(16, '0');
  const denomSignature = coin.denom.signature.slice(32).padStart(144, '0');
  // Encoding fee denom
  const feeDenomLabel = Buffer.from(fee.denom.name, 'ascii').toString('hex').padStart(16, '0');
  const feeDenom = fee.denom.protoUnit.padStart(16, '0');
  const feeDenomSignature = fee.denom.signature.slice(32).padStart(144, '0');

  const isMemoEmpty = terraData.memo.length === 0 ? "01" : "00";
  const memo = Buffer.from(terraData.memo, 'ascii').toString('hex').padStart(256, '0');

  const argument =
    pubKey +
    from +
    to +
    amount +
    feeAmount +
    gas +
    accountNumber +
    sequence +
    denomLabel +
    denom +
    denomSignature +
    feeDenomLabel +
    feeDenom +
    feeDenomSignature +
    isMemoEmpty +
    memo;

  console.debug(getTerraSendArgument.name, argument);

  return addPath(argument, addressIndex);
}

/**
 * Get Luna Delegate Or Undelegate Argument
 *
 * @param terraData
 * @param addressIndex
 */
export function getTerraStakingArgument(
  publicKey: string,
  terraData: types.MsgDelegate | types.MsgUndelegate,
  addressIndex: number
) {
  const pubKey = publicKey.padStart(66, '0');
  const delegatorAddress = Buffer.from(terraData.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const validatorAddress = Buffer.from(terraData.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const { coin, fee } = terraData;
  // Encoding amount denom
  const amount = coin.amount.toString(16).padStart(16, '0');
  const feeAmount = fee.amount.toString(16).padStart(16, '0');
  const gas = fee.gas_limit.toString(16).padStart(16, '0');
  const accountNumber = parseInt(terraData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(terraData.sequence).toString(16).padStart(16, '0');
  const isMemoEmpty = terraData.memo.length === 0 ? "01" : "00";
  const memo = Buffer.from(terraData.memo, 'ascii').toString('hex').padStart(256, '0');
  // Encoding Fee denom
  const feeDenomLabel = Buffer.from(fee.denom.name, 'ascii').toString('hex').padStart(16, '0');
  const feeDenom = fee.denom.protoUnit.padStart(16, '0');
  const feeDenomSignature = fee.denom.signature.slice(32).padStart(144, '0');

  let argument = pubKey + delegatorAddress + validatorAddress + amount + feeAmount + gas + accountNumber + sequence;

  if (coin?.denom) {
    const denomLabel = Buffer.from(coin.denom.name, 'ascii').toString('hex').padStart(16, '0');
    const denom = coin.denom.protoUnit.padStart(16, '0');
    const denomSignature = coin.denom.signature.slice(32).padStart(144, '0');
    argument += denomLabel + denom + denomSignature;
  }
  argument += feeDenomLabel + feeDenom + feeDenomSignature + isMemoEmpty + memo;

  console.debug(getTerraStakingArgument.name, argument);

  return addPath(argument, addressIndex);
}

/**
 * Get Luna MsgWithdrawDelegatorReward Argument
 *
 * @param terraData
 * @param addressIndex
 */
export function getMsgWithdrawDelegatorRewardArgument(
  publicKey: string,
  terraData: types.MsgWithdrawDelegatorReward,
  addressIndex: number
) {
  const pubKey = publicKey.padStart(66, '0');
  const delegatorAddress = Buffer.from(terraData.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const validatorAddress = Buffer.from(terraData.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const { fee } = terraData;
  // Encoding amount denom
  const feeAmount = fee.amount.toString(16).padStart(16, '0');
  const gas = fee.gas_limit.toString(16).padStart(16, '0');
  const accountNumber = parseInt(terraData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(terraData.sequence).toString(16).padStart(16, '0');
  const isMemoEmpty = terraData.memo.length === 0 ? "01" : "00";
  const memo = Buffer.from(terraData.memo, 'ascii').toString('hex').padStart(256, '0');
  // Encoding Fee denom
  const feeDenomLabel = Buffer.from(fee.denom.name, 'ascii').toString('hex').padStart(16, '0');
  const feeDenom = fee.denom.protoUnit.padStart(16, '0');
  const feeDenomSignature = fee.denom.signature.slice(32).padStart(144, '0');

  const argument =
    pubKey +
    delegatorAddress +
    validatorAddress +
    feeAmount +
    gas +
    accountNumber +
    sequence +
    feeDenomLabel +
    feeDenom +
    feeDenomSignature +
    isMemoEmpty +
    memo;

  console.debug(getMsgWithdrawDelegatorRewardArgument.name, argument);

  return addPath(argument, addressIndex);
}

export function getTerraSmartArgument(publicKey: string, terraData: types.MsgExecuteContract, addressIndex: number) {
  const pubKey = publicKey.padStart(66, '0');
  const senderAddress = Buffer.from(terraData.senderAddress, 'ascii').toString('hex').padStart(128, '0');
  const contractAddress = Buffer.from(terraData.contractAddress, 'ascii').toString('hex').padStart(128, '0');
  let fundsInfo = ''.padStart(32, '0');
  let fundsDenomSignature = ''.padStart(144, '0');
  let fundsAmount = ''.padStart(16, '0');
  const { funds } = terraData;
  if (funds) {
    const fundsDenomLabel = Buffer.from(funds.denom.name, 'ascii').toString('hex').padStart(16, '0');
    const fundsDenom = funds.denom.protoUnit.padStart(16, '0');
    fundsInfo = fundsDenomLabel + fundsDenom;
    fundsDenomSignature = funds.denom.signature.slice(32).padStart(144, '0');
    fundsAmount = funds.amount.toString(16).padStart(16, '0');
  }
  const { fee } = terraData;
  const feeAmount = fee.amount.toString(16).padStart(16, '0');
  const gas = fee.gas_limit.toString(16).padStart(16, '0');
  const feeDenomLabel = Buffer.from(fee.denom.name, 'ascii').toString('hex').padStart(16, '0');
  const feeDenom = fee.denom.protoUnit.padStart(16, '0');
  const feeDenomSignature = fee.denom.signature.slice(32).padStart(144, '0');
  const accountNumber = parseInt(terraData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(terraData.sequence).toString(16).padStart(16, '0');
  const isMemoEmpty = terraData.memo.length === 0 ? "01" : "00";
  const memo = Buffer.from(terraData.memo, 'ascii').toString('hex').padStart(256, '0');
  const execute_msg = Buffer.from(JSON.stringify(terraData.execute_msg), 'utf-8').toString('hex');

  const argument =
    pubKey +
    senderAddress +
    contractAddress +
    fundsInfo +
    fundsDenomSignature +
    fundsAmount +
    feeDenomLabel +
    feeDenom +
    feeDenomSignature +
    feeAmount +
    gas +
    accountNumber +
    sequence +
    isMemoEmpty + 
    memo +
    execute_msg;

  console.debug('getTerraSmartArgument: ' + argument);

  return addPath(argument, addressIndex);
}

export function getCW20Argument(
  publicKey: string,
  terraData: types.MsgCW20,
  addressIndex: number,
  tokenSignature: string
) {
  const { amount, recipient } = terraData.execute_msg.transfer;
  const pubKey = publicKey.padStart(66, '0');
  const senderAddress = Buffer.from(terraData.senderAddress, 'ascii').toString('hex').padStart(128, '0');
  const contractAddress = Buffer.from(terraData.contractAddress, 'ascii').toString('hex').padStart(128, '0');
  const toAddress = Buffer.from(recipient, 'ascii').toString('hex').padStart(128, '0');
  const value = parseInt(amount).toString(16).padStart(16, '0');
  const { fee } = terraData;
  const feeDenomLabel = Buffer.from(fee.denom.name, 'ascii').toString('hex').padStart(16, '0');
  const feeDenom = fee.denom.protoUnit.padStart(16, '0');
  const feeDenomSignature = fee.denom.signature.slice(32).padStart(144, '0');
  const feeAmount = fee.amount.toString(16).padStart(16, '0');
  const gas = fee.gas_limit.toString(16).padStart(16, '0');
  const accountNumber = parseInt(terraData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(terraData.sequence).toString(16).padStart(16, '0');
  const isMemoEmpty = terraData.memo.length === 0 ? "01" : "00";
  const memo = Buffer.from(terraData.memo, 'ascii').toString('hex').padStart(256, '0');

  const txTokenInfo = terraData.option;
  const tokenInfo = token.getSetTokenPayload(
    terraData.contractAddress,
    txTokenInfo?.info.symbol ?? '',
    parseInt(txTokenInfo?.info.decimals ?? '')
  );
  const signature = tokenSignature.slice(106).padStart(144, '0');

  const execute_msg = Buffer.from(JSON.stringify(terraData.execute_msg)).toString('hex');

  const argument =
    pubKey +
    senderAddress +
    contractAddress +
    toAddress +
    value +
    feeDenomLabel +
    feeDenom +
    feeDenomSignature +
    feeAmount +
    gas +
    accountNumber +
    sequence +
    isMemoEmpty + 
    memo +
    tokenInfo +
    signature +
    execute_msg;

  console.debug('getTerraCW20Argument: ' + argument);
  return addPath(argument, addressIndex);
}

export function getMsgBlindArgument(publicKey: string, terraData: types.MsgBlind, addressIndex: number, data: string) {
  const pubKey = publicKey.padStart(66, '0');
  const { fee } = terraData;
  const feeDenom = getDenomFromFee(fee, 'getMsgBlindArgument');
  const feeAmount = fee.amount[0].amount;
  const feeAmountHex = (+feeAmount).toString(16).padStart(16, '0');
  const gas = (+fee.gas_limit).toString(16).padStart(16, '0');
  const accountNumber = parseInt(terraData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(terraData.sequence).toString(16).padStart(16, '0');
  const feeDenomLabel = Buffer.from(feeDenom.name, 'ascii').toString('hex').padStart(16, '0');
  const feeDenomUnit = feeDenom.protoUnit.padStart(16, '0');
  const feeDenomSignature = feeDenom.signature.slice(32).padStart(144, '0');
  const dataLengthHex = (data.length / 2).toString(16).padStart(8, '0');

  const argument =
    pubKey +
    feeAmountHex +
    gas +
    accountNumber +
    sequence +
    feeDenomLabel +
    feeDenomUnit +
    feeDenomSignature +
    dataLengthHex;

  console.debug('getMsgBlindArgument: ' + argument);
  return addPath(argument, addressIndex);
}
