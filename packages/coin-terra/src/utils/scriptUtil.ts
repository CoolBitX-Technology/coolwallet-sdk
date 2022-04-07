import * as params from "../config/params";
import * as types from "../config/types";

export function getTerraSendArgement(publicKey: string, terraData: types.MsgSend, addressIndex: number) {
  const pubKey = publicKey.padStart(66, '0');
  const from = Buffer.from(terraData.fromAddress, 'ascii').toString('hex').padStart(128, '0');
  const to = Buffer.from(terraData.toAddress, 'ascii').toString('hex').padStart(128, '0');
  const amount = terraData.amount.toString(16).padStart(16, '0');
  const feeAmount = terraData.feeAmount.toString(16).padStart(16, '0');
  const gas = terraData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(terraData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(terraData.sequence).toString(16).padStart(16, '0');
  const denomLabel = Buffer.from(terraData.denom.name, 'ascii').toString('hex').padStart(16, '0');
  const denom = terraData.denom.protoUnit.padStart(16, '0');
  const denomSignature = terraData.denom.signature.slice(32).padStart(144, "0"); 
  const feeDenomLabel = Buffer.from(terraData.feeDenom.name, 'ascii').toString('hex').padStart(16, '0');
  const feeDenom = terraData.feeDenom.protoUnit.padStart(16, '0');
  const feeDenomSignature = terraData.feeDenom.signature.slice(32).padStart(144, "0");

  const memo = Buffer.from(terraData.memo, 'ascii').toString('hex');

  const argument = pubKey + from + to + amount + feeAmount + gas + accountNumber + sequence + denomLabel + denom + denomSignature + feeDenomLabel + feeDenom + feeDenomSignature + memo;

  console.debug("getTerraSendArgement: " + argument);

  return addPath(argument, addressIndex);
}

/**
 * Get Luna Delegate Or Undelegate Argement
 * @param terraData 
 * @param addressIndex 
 */
export function getTerraDelgtOrUnDelArgement(publicKey: string, terraData: types.MsgDelegate, addressIndex: number) {

  const pubKey = publicKey.padStart(66, '0');
  const delegatorAddress = Buffer.from(terraData.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const validatorAddress = Buffer.from(terraData.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const amount = terraData.amount.toString(16).padStart(16, '0');
  const feeAmount = terraData.feeAmount.toString(16).padStart(16, '0');
  const gas = terraData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(terraData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(terraData.sequence).toString(16).padStart(16, '0');
  const memo = Buffer.from(terraData.memo, 'ascii').toString('hex');
  const denomLabel = Buffer.from(terraData.denom.name, 'ascii').toString('hex').padStart(16, '0');
  const denom = terraData.denom.protoUnit.padStart(16, '0');
  const denomSignature = terraData.denom.signature.slice(32).padStart(144, "0"); 
  const feeDenomLabel = Buffer.from(terraData.feeDenom.name, 'ascii').toString('hex').padStart(16, '0');
  const feeDenom = terraData.feeDenom.protoUnit.padStart(16, '0');
  const feeDenomSignature = terraData.feeDenom.signature.slice(32).padStart(144, "0");

  const argument = pubKey + delegatorAddress + validatorAddress + amount + feeAmount + gas + accountNumber + sequence + denomLabel + denom + denomSignature + feeDenomLabel + feeDenom + feeDenomSignature + memo;

  console.debug("getTerraDelgtOrUnDelArgement: " + argument);

  return addPath(argument, addressIndex);
}

export function getTerraWithdrawArgement(publicKey: string, terraData: types.MsgWithdrawDelegationReward, addressIndex: number) {

  const pubKey = publicKey.padStart(66, '0');
  const delegatorAddress = Buffer.from(terraData.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const validatorAddress = Buffer.from(terraData.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const feeAmount = terraData.feeAmount.toString(16).padStart(16, '0');
  const gas = terraData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(terraData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(terraData.sequence).toString(16).padStart(16, '0');
  const feeDenomLabel = Buffer.from(terraData.feeDenom.name, 'ascii').toString('hex').padStart(16, '0');
  const feeDenom = terraData.feeDenom.protoUnit.padStart(16, '0');
  const feeDenomSignature = terraData.feeDenom.signature.slice(32).padStart(144, "0");
  const memo = Buffer.from(terraData.memo, 'ascii').toString('hex');

  const argument = pubKey + delegatorAddress + validatorAddress + feeAmount + gas + accountNumber + sequence + feeDenomLabel + feeDenom + feeDenomSignature + memo;

  console.debug("getTerraWithdrawArgement: " + argument);

  return addPath(argument, addressIndex);
}

export function getTerraSmartArgument(publicKey: string, terraData: types.MsgExecuteContract, addressIndex: number) {
  const pubKey = publicKey.padStart(66, '0');
  const senderAddress = Buffer.from(terraData.senderAddress, 'ascii').toString('hex').padStart(128, '0');
  const contractAddress = Buffer.from(terraData.contractAddress, 'ascii').toString('hex').padStart(128, '0');
  let fundsInfo = ''.padStart(32, '0');
  let fundsDenomSignature = ''.padStart(144, '0');
  let fundsAmount = ''.padStart(16, '0');
  if (terraData.funds !== undefined) {
    const fundsDenomLabel = Buffer.from(terraData.funds.denom.name, 'ascii').toString('hex').padStart(16, '0');
    const fundsDenom = terraData.funds.denom.protoUnit.padStart(16, '0');
    fundsInfo = fundsDenomLabel + fundsDenom;
    fundsDenomSignature = terraData.funds.denom.signature.slice(32).padStart(144, "0"); 
    fundsAmount = terraData.funds.amount.toString(16).padStart(16, '0');
  }
  const feeAmount = terraData.feeAmount.toString(16).padStart(16, '0');
  const gas = terraData.gas.toString(16).padStart(16, '0');
  const accountNumber = parseInt(terraData.accountNumber).toString(16).padStart(16, '0');
  const sequence = parseInt(terraData.sequence).toString(16).padStart(16, '0');
  const memo = Buffer.from(terraData.memo, 'ascii').toString('hex').padStart(256, '0');
  const execute_msg = Buffer.from(terraData.execute_msg).toString('hex');
  const feeDenomLabel = Buffer.from(terraData.feeDenom.name, 'ascii').toString('hex').padStart(16, '0');
  const feeDenom = terraData.feeDenom.protoUnit.padStart(16, '0');
  const feeDenomSignature = terraData.feeDenom.signature.slice(32).padStart(144, "0");

  const argument =
    pubKey +
    senderAddress +
    contractAddress +
    fundsInfo +
    fundsDenomSignature + 
    fundsAmount +
    feeDenomLabel + feeDenom + feeDenomSignature + 
    feeAmount +
    gas +
    accountNumber +
    sequence +
    memo +
    execute_msg;

  console.debug('getTerraSmartArgument: ' + argument);

  return addPath(argument, addressIndex);
}

function addPath(argument: string, addressIndex: number) {
  const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  const SEPath = `15328000002C${params.COIN_TYPE}8000000000000000${addressIdxHex}`;
  console.debug("SEPath: " + SEPath);
  return SEPath + argument;
}