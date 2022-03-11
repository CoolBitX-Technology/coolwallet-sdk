import { coin as COIN, Transport } from '@coolwallet/core';
import * as params from './config/params';
import * as txUtil from './utils/transactionUtils';
import * as types from './config/types';
import { SDKError } from '@coolwallet/core/lib/error';
import * as scriptUtil from './utils/scriptUtil';
import * as sign from './sign';

export default class LUNA extends COIN.ECDSACoin implements COIN.Coin{
    public Types: any;

    constructor(){
        super(params.COIN_TYPE);
        this.Types = types;
    }

    async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string>{
        const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
        return txUtil.publicKeyToAddress(publicKey);
    }

    async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
        const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
        return txUtil.publicKeyToAddress(publicKey);
    }

    async signTransaction(signData: types.SignDataType): Promise<string> {
        const chainId = signData.transaction.chainId;
        switch (chainId) {
          case types.CHAIN_ID.LUNA:
            return this.signLUNATransaction(signData);
          default:
            throw new SDKError(this.signTransaction.name, `not support input chainId: ${chainId}`);
        }
    }

    async signLUNATransaction(signData: types.SignDataType): Promise<string> {
        const { addressIndex } = signData;
    
        const publicKey = await this.getPublicKey(signData.transport, signData.appPrivateKey, signData.appId, addressIndex);
    
        let script;
        let argument;
        let genTx;
        switch (signData.txType) {
          case types.TX_TYPE.SEND:
            script = params.TRANSFER.script + params.TRANSFER.signature;
            argument = scriptUtil.getLunaSendArgement(publicKey, signData.transaction, addressIndex);
            genTx = (signature: string) => {
              return txUtil.getSendTx(signData.transaction, signature, publicKey);
            };
            break;
          case types.TX_TYPE.DELEGATE:
            script = params.DELEGATE.script + params.DELEGATE.signature;
            argument = scriptUtil.getLunaDelgtOrUnDelArgement(publicKey, signData.transaction, addressIndex);
            genTx = (signature: string) => {
              return txUtil.getDelegateTx(signData.transaction, signature, publicKey);
            };
            break;
          case types.TX_TYPE.UNDELEGATE:
            script = params.UNDELEGATE.script + params.UNDELEGATE.signature;
            argument = scriptUtil.getLunaDelgtOrUnDelArgement(publicKey, signData.transaction, addressIndex);
            genTx = (signature: string) => {
              return txUtil.getUndelegateTx(signData.transaction, signature, publicKey);
            };
            break;
          case types.TX_TYPE.WITHDRAW:
            script = params.WITHDRAW.script + params.WITHDRAW.signature;
            argument = scriptUtil.getLunaWithdrawArgement(publicKey, signData.transaction, addressIndex);
            genTx = (signature: string) => {
              return txUtil.getWithdrawDelegatorRewardTx(signData.transaction, signature, publicKey);
            };
            break;
          default:
            throw new SDKError(this.signLUNATransaction.name, `not support input tx type`);
        }
        const signature = await sign.signTransaction(signData, script, argument);
        console.debug('signature: ', signature);
        const signTx = genTx(signature);
        console.debug('signTx protobuf: ', signTx);
        const txBytesBase64 = Buffer.from(signTx, 'hex').toString('base64');
        return txBytesBase64;
    }
}