/* eslint-disable no-param-reassign */
import { coin as COIN, transport, setting } from '@coolwallet/core';
import * as sign from './sign';
import { pubKeyToAddress } from './utils/ethUtils';
import { TypedData } from 'eth-sig-util';

type Transport = transport.default;
export default class QKC extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super('FF');
  }

  /**
   * Get Ethereum address by index
   * @param {number} addressIndex
   * @return {string}
   */
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return pubKeyToAddress(publicKey);
  }

  /**
   * Sign Ethereum Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
   * value:string, data:string}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signTransaction(
    transport: Transport, 
    appPrivateKey: string, 
    appId: string, 
		transaction: {
			nonce: string,
			gasPrice: string,
			gasLimit: string,
			to: string,
			value: string,
			data: string,
			fromFullShardKey: string,
			toFullShardKey: string },
    addressIndex: number,
    publicKey: string | undefined = undefined,
    confirmCB: Function | undefined = undefined,
    authorizedCB: Function | undefined = undefined
  ) {
    if (!publicKey) publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return sign.signTransaction(
      transport,
      appId,
      appPrivateKey,
      this.coinType,
      transaction,
      addressIndex,
      publicKey,
      confirmCB,
      authorizedCB
    );
  }

  /**
   * Sign Arbitrary Message.
   * @param {String} message hex or utf-8
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Boolean} isHashRequired
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   * @return {Promise<String>}
   */
  async signMessage(
    transport: Transport,
    appPrivateKey: string,
    appId: string, 
    message: string,
    addressIndex: number,
    publicKey: string | undefined = undefined,
    isHashRequired: boolean = false,
    confirmCB: Function | undefined = undefined,
    authorizedCB: Function | undefined = undefined
  ): Promise<string> {
    await setting.auth.versionCheck(transport, 81);
    if (!publicKey) {
      publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    }
    return sign.signMessage(
      transport,
      appId,
      appPrivateKey,
      this.coinType,
      message,
      addressIndex,
      publicKey,
      isHashRequired,
      confirmCB,
      authorizedCB
    );
  }

  /**
   * Sign EIP712 typed data
   * @param {Object} typedData
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signTypedData(
    transport: Transport,
    appPrivateKey: string,
    appId: string, 
    typedData: object,
    addressIndex: number,
    publicKey: string | undefined = undefined,
    confirmCB: Function | undefined = undefined,
    authorizedCB: Function | undefined = undefined
  ) {
    await setting.auth.versionCheck(transport, 84);
    if (!publicKey) publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return sign.signTypedData(
      transport,
      appId,
      appPrivateKey,
      this.coinType,
      typedData,
      addressIndex,
      publicKey,
      confirmCB,
      authorizedCB
    );
  }
}
