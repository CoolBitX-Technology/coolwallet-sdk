/* eslint-disable no-param-reassign */
import { coin as COIN, transport, setting } from '@coolwallet/core';
import * as trxSign from './sign';
import * as scriptUtil from './utils/scriptUtils';
import { coinType, signTx, transactionType} from './config/type'
import * as trxUtil from './utils/trxUtils';
import * as scripts from "./config/scripts";
import { TOKENTYPE } from "./config/tokenType";

export {
  transactionType, TOKENTYPE
};

type Transport = transport.default;
export default class TRX extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(coinType);
  }

  /**
   * Get Ethereum address by index
   * @param {number} addressIndex
   * @return {string}
   */
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return trxUtil.pubKeyToAddress(publicKey);
  }


  /**
   * Sign Ethereum Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
   * value:string, data:string, chainId: number}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signTransaction(
    signTxData: signTx
  ) {
    const txData = signTxData.transaction;

    // eth
    if (txData.value && !txData.data) {
      return await this.signTransferTransaction(signTxData);
    }


  }


  /**
   * Sign Ethereum Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
   * value:string, data:string, chainId: number}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signTransferTransaction(
    signTxData: signTx
  ) {
    const publicKey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, signTxData.addressIndex);
    const getArg = async () => {
      return scriptUtil.getTransferArgument(signTxData.transaction);
    }
    const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;

    const argument = await scriptUtil.getArgument(signTxData.addressIndex, getArg);
    
    return trxSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey,
    );
  }
}
