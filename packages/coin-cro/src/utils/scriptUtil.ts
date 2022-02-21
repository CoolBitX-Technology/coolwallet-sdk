import * as params from "../config/params";
import * as types from "../config/types";

export function getCroSendArgement(publicKey: string, croData: types.MsgSend, addressIndex: number) {
    const pubKey = publicKey.padStart(66, '0');
    const from = Buffer.from(croData.fromAddress, 'ascii').toString('hex').padStart(128, '0');
    const to = Buffer.from(croData.toAddress, 'ascii').toString('hex').padStart(128, '0');
    const amount = croData.amount.toString(16).padStart(16, '0');
    const feeAmount = croData.feeAmount.toString(16).padStart(16, '0');
    const gas = croData.gas.toString(16).padStart(16, '0');
    const accountNumber = parseInt(croData.accountNumber).toString(16).padStart(16, '0');
    const sequence = parseInt(croData.sequence).toString(16).padStart(16, '0');
    const memo = Buffer.from(croData.memo, 'ascii').toString('hex');

    const argument = pubKey + from + to + amount + feeAmount + gas + accountNumber + sequence + memo;

    console.debug("getCroSendArgement: " + argument);

    return addPath(argument, addressIndex);
}

/**
 * Get Cro Delegate Or Undelegate Argement
 * @param croData 
 * @param addressIndex 
 */
 export function getCroDelgtOrUnDelArgement(publicKey: string, croData: types.MsgDelegate, addressIndex: number) {

    const pubKey = publicKey.padStart(66, '0');
    const delegatorAddress = Buffer.from(croData.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
    const validatorAddress = Buffer.from(croData.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
    const amount = croData.amount.toString(16).padStart(16, '0');
    const feeAmount = croData.feeAmount.toString(16).padStart(16, '0');
    const gas = croData.gas.toString(16).padStart(16, '0');
    const accountNumber = parseInt(croData.accountNumber).toString(16).padStart(16, '0');
    const sequence = parseInt(croData.sequence).toString(16).padStart(16, '0');
    const memo = Buffer.from(croData.memo, 'ascii').toString('hex');
  
    const argument = pubKey + delegatorAddress + validatorAddress + amount + feeAmount + gas + accountNumber + sequence + memo;
  
    console.debug("getCroDelgtOrUnDelArgement: " + argument);
  
    return addPath(argument, addressIndex);
}

export function getCroWithdrawArgement(publicKey: string, croData: types.MsgWithdrawDelegationReward, addressIndex: number) {

    const pubKey = publicKey.padStart(66, '0');
    const delegatorAddress = Buffer.from(croData.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
    const validatorAddress = Buffer.from(croData.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
    const feeAmount = croData.feeAmount.toString(16).padStart(16, '0');
    const gas = croData.gas.toString(16).padStart(16, '0');
    const accountNumber = parseInt(croData.accountNumber).toString(16).padStart(16, '0');
    const sequence = parseInt(croData.sequence).toString(16).padStart(16, '0');
    const memo = Buffer.from(croData.memo, 'ascii').toString('hex');
  
    const argument = pubKey + delegatorAddress + validatorAddress + feeAmount + gas + accountNumber + sequence + memo;
  
    console.debug("getCroWithdrawArgement: " + argument);
  
    return addPath(argument, addressIndex);
}

function addPath(argument: string, addressIndex: number) {
    const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
    const SEPath = `15328000002C${params.COIN_TYPE}8000000000000000${addressIdxHex}`;
    console.debug("SEPath: " + SEPath);
    return SEPath + argument;
}