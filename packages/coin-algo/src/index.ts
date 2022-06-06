import { coin as COIN, error as ERROR, Transport, utils, config } from '@coolwallet/core';
import * as params from './config/params';
import * as types from './config/types';
import { signTransaction } from './sign';
import {
    pubKeyToAddress,
    getPaymentArgument,
    getAssetTransferArgument,
    getAssetConfigArgument,
    getAssetFreezeArgument,
    getApplicationCallArgument,
    getKeyRegistrationArgument
} from './utils/scriptUtils';

export default class ALGO extends COIN.EDDSACoin implements COIN.Coin {
    constructor() {
        super(params.COIN_TYPE);
    }

    async getAddress(transport: Transport, appPrivateKey: string, appId: string): Promise<string> {
        const path = utils.getFullPath({
            pathType: config.PathType.SLIP0010,
            pathString: "44'/283'/0'/0'/0'",
        });
        const publicKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
        if (!publicKey) {
            throw new ERROR.SDKError(this.getAddress.name, 'Public key is undefined');
        }
        return pubKeyToAddress(publicKey);
    }

    async signTransaction(signTxData: types.SignTxType): Promise<string> {
        let script, argument;
        switch (signTxData.transaction.type) {
            case types.TransactionType.PAYMENT:
                script = params.PAYMENT.script + params.PAYMENT.signature;
                argument = await getPaymentArgument(signTxData.transaction);
                break;
            case types.TransactionType.KEY_REGISTRATION:
                script = params.KEY_REGISTRATION.script + params.KEY_REGISTRATION.signature;
                argument = await getKeyRegistrationArgument(signTxData.transaction);
                break;
            case types.TransactionType.ASSET_CONFIG:
                script = params.ASSET_CONFIG.script + params.ASSET_CONFIG.signature;
                argument = await getAssetConfigArgument(signTxData.transaction);
                break;
            case types.TransactionType.ASSET_TRANSFER:
                script = params.ASSET_TRANSFER.script + params.ASSET_TRANSFER.signature;
                argument = await getAssetTransferArgument(signTxData.transaction);
                break;
            case types.TransactionType.ASSET_FREEZE:
                script = params.ASSET_FREEZE.script + params.ASSET_FREEZE.signature;
                argument = await getAssetFreezeArgument(signTxData.transaction);
                break;
            case types.TransactionType.APPLICATION_CALL:
                script = params.APPLICATION_CALL.script + params.APPLICATION_CALL.signature;
                argument = await getApplicationCallArgument(signTxData.transaction);
                break;
            default: throw new ERROR.SDKError(this.signTransaction.name, `not support type: ${signTxData.transaction['type']}`);
        }

        console.log('argument', argument);
        return signTransaction(signTxData, script, argument);
    }
}