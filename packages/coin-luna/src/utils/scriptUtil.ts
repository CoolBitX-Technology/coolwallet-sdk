import * as params from "../config/params";
import * as types from "../config/types";

export function getLunaSendArgement(publicKey: string, lunaData: types.MsgSend, addressIndex: number) {
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

    console.debug("getLunaSendArgement: " + argument);

    return addPath(argument, addressIndex);
}

function addPath(argument: string, addressIndex: number) {
    const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
    const SEPath = `15328000002C${params.COIN_TYPE}8000000000000000${addressIdxHex}`;
    console.debug("SEPath: " + SEPath);
    return SEPath + argument;
}