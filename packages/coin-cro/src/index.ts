import { coin as COIN, Transport, utils, config, apdu, tx } from '@coolwallet/core';
import { pubKeyToAddress } from './utils/ethUtils';
import * as params from './config/params';

export default class CRO extends COIN.ECDSACoin implements COIN.Coin{
    constructor(){
        super(params.COIN_TYPE);
    }

    async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
        const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
        return pubKeyToAddress(publicKey);
    };

    async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
        const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
        return pubKeyToAddress(publicKey);
      }

    signTransaction = async(): Promise<string> => {
        return '';
    }
}