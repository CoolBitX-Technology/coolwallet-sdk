/* eslint-disable no-param-reassign */
import { coin as COIN, transport, setting } from '@coolwallet/core';
import * as trxSign from './sign';
import * as scriptUtil from './utils/scriptUtils';
import * as trxUtil from './utils/trxUtils';
import * as scripts from './config/scripts';

type Transport = transport.default;
export default class TRX extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super('C3');
  }

  /**
   * Get Tron address by index
   * @param {number} addressIndex
   * @return {string}
   */
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return trxUtil.pubKeyToAddress(publicKey);
  }

  /**
   * Sign Tron Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
   * value:string, data:string, chainId: number}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signTransaction(signTxData: any) {
    const publicKey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, signTxData.addressIndex);

    const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;

    return trxSign.signTransaction(
      signTxData,
      script,
      publicKey,
    );
  }
}
