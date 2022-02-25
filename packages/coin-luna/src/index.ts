import { coin as COIN, Transport } from '@coolwallet/core';
import * as params from './config/params';
import * as txUtil from './utils/transactionUtils';

export default class LUNA extends COIN.ECDSACoin implements COIN.Coin{
    public Types: any;

    constructor(){
        super(params.COIN_TYPE);
    }

    async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string>{
        const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
        return txUtil.publicKeyToAddress(publicKey);
    }

    async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
        const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
        return txUtil.publicKeyToAddress(publicKey);
    }

    async signTransaction(){
        return '';
    }
}