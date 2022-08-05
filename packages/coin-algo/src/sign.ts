
import { tx, apdu, utils, config } from '@coolwallet/core';
import * as types from './config/types';
import * as scriptUtils from './utils/scriptUtils'

const getSEPath = () => {
    const path = utils.getFullPath({
        pathType: config.PathType.SLIP0010,
        pathString: "44'/283'/0'/0'/0'",
    });
    return `15${path}`;
}

const signTransaction = async (
    signTxData: types.SignTxType,
    script: string,
    argument: (Buffer | string)[]
): Promise<string> => {
    const path = getSEPath();
    const sent = () => apdu.tx.sendScript(signTxData.transport, script);
    const executeRlpScript = () => apdu.tx.executeRlpScript(signTxData.transport, signTxData.appId, signTxData.appPrivateKey, path, argument);
    const sig = (await tx.flow.getSingleSignatureFromCoolWallet(
        signTxData.transport,
        [sent],
        executeRlpScript,
        true
    )) as Buffer;
    return await scriptUtils.getSignedTransaction(signTxData, sig)
}

export { signTransaction }

