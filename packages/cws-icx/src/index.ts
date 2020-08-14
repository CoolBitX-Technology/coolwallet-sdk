import { coin as COIN, transport } from '@coolwallet/core';
import signTransaction from './sign';
import { pubKeyToAddress } from './utils/util';

type Transport = transport.default;

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
    transport: Transport, 
    appPrivateKey: string, 
    appId: string, 
    transaction: Object,
    addressIndex: number,
    publicKey: string,
    confirmCB: Function | undefined = undefined,
    authorizedCB: Function | undefined = undefined
  ) {
    if (publicKey === undefined) publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return signTransaction(
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
}
