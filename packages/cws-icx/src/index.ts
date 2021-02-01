import { coin as COIN } from '@coolwallet/core';
import signTransaction from './sign';
import * as txUtil from './utils/transactionUtil'
import * as params from './config/params';
import * as types from './config/types' 


export default class ICX extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  /**
   * Get ICON address by index
   */
  async getAddress(transport: types.Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.pubKeyToAddress(publicKey);
  }

  /**
   * Sign ICX Transaction.
   */
  async signTransaction(
    signTxData: types.signTxType
  ) {
    const publicKey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, signTxData.addressIndex);

    return signTransaction(
      signTxData,
      publicKey
    );
  }
}
