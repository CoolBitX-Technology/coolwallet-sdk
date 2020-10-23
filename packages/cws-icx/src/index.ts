import { coin as COIN, transport } from '@coolwallet/core';
import signTransaction from './sign';
import { pubKeyToAddress } from './util';

import { Transport, signTxType } from './types'

export const coinType = '4A'

export default class ICX extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(coinType);
  }

  /**
   * Get ICON address by index
   */
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return pubKeyToAddress(publicKey);
  }

  /**
   * Sign ICX Transaction.
   */
  async signTransaction(
    signTxData: signTxType
  ) {
    const publicKey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, signTxData.addressIndex);

    return signTransaction(
      signTxData,
      this.coinType,
      publicKey
    );
  }
}

