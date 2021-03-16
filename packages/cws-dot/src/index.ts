/* eslint-disable no-param-reassign */
import { coin as COIN, setting } from '@coolwallet/core';
import { pubKeyToAddress } from './utils/transactionUtils';
import * as types from './config/types'
import * as params from "./config/params"; 
import * as scriptUtil from "./utils/scriptUtils";
import * as dotSign from "./sign";


export default class DOT extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE); 
  }


  async getAddress(transport: types.Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return pubKeyToAddress(publicKey);
  }
 
  async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return pubKeyToAddress(publicKey);
  }


  async signTransaction(
    signTxData: types.NormalTransferData
  ) {
    const {
      transport, transaction, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script = params.TRANSFER.script + params.TRANSFER.signature;
    const argument = await scriptUtil.getNormalTradeArgument(transaction, addressIndex);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    return dotSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );

  }
}
