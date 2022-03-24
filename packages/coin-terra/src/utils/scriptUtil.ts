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
  
    const argument = pubKey + delegatorAddress + validatorAddress + amount + feeAmount + gas + accountNumber + sequence + memo;
  
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
    const memo = Buffer.from(terraData.memo, 'ascii').toString('hex');
  
    const argument = pubKey + delegatorAddress + validatorAddress + feeAmount + gas + accountNumber + sequence + memo;
  
    console.debug("getTerraWithdrawArgement: " + argument);
  
    return addPath(argument, addressIndex);
}

function addPath(argument: string, addressIndex: number) {
    const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
    const SEPath = `15328000002C${params.COIN_TYPE}8000000000000000${addressIdxHex}`;
    console.debug("SEPath: " + SEPath);
    return SEPath + argument;
}