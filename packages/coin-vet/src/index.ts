import { coin as COIN } from '@coolwallet/core';
import { signTransaction, signCertificate } from './sign';
import * as txUtil from './utils/transactionUtil';
import * as params from './config/params';
import * as types from './config/types';

export default class VET extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  /**
   * Get VET address by index
   */
  async getAddress(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.pubKeyToAddress(publicKey);
  }

  async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return txUtil.pubKeyToAddress(publicKey);
  }

  /**
   * Sign VET VIP191 Transaction.
  */
   async signVIP191Transaction(signTxData: types.signTxType) {
    const publicKey = await this.getPublicKey(
      signTxData.transport,
      signTxData.appPrivateKey,
      signTxData.appId,
      signTxData.addressIndex
    );

    return signTransaction(signTxData, publicKey);
  }

  /**
   * Sign VET Transaction.
  */
  async signTransaction(signTxData: types.signTxType) {

    const { delegator } = signTxData.transaction;

    const publicKey = await this.getPublicKey(
      signTxData.transport,
      signTxData.appPrivateKey,
      signTxData.appId,
      signTxData.addressIndex
    );

    if(delegator) {
      return this.signVIP191Transaction(signTxData);
    }

    return signTransaction(signTxData, publicKey);
  }



  /**
   * Sign VET Certificate.
   */
  async signCertificate(signTxData: types.signCertType) {
    const publicKey = await this.getPublicKey(
      signTxData.transport,
      signTxData.appPrivateKey,
      signTxData.appId,
      signTxData.addressIndex
    );

    return signCertificate(signTxData, publicKey);
  }
}
