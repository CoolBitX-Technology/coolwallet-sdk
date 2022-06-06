
import { tx, apdu } from '@coolwallet/core';
import * as types from './config/types';

const signTransaction = async (
    signTxData: types.SignTxType,
    script: string,
    argument: string
): Promise<string> => {
    await apdu.tx.sendScript(signTxData.transport!, script);
    const encryptedSig = await apdu.tx.executeScript(signTxData.transport!, signTxData.appId, signTxData.appPrivateKey, argument);
    await apdu.tx.finishPrepare(signTxData.transport!);
    await apdu.tx.getTxDetail(signTxData.transport!);
    const decryptingKey = await apdu.tx.getSignatureKey(signTxData.transport!);
    await apdu.tx.clearTransaction(signTxData.transport!);
    await apdu.mcu.control.powerOff(signTxData.transport!);
    const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, true, false);
    return sig.toString('hex');
}

export { signTransaction }