import { coin as COIN, transport } from '@coolwallet/core';
import signTransaction from './sign';
import { pubKeyToAddress } from './utils/util';

type Transport = transport.default;

export default class ICX extends COIN.ECDSACoin implements COIN.Coin {
  constructor(transport: Transport, appPrivateKey: string, appId: string) {
    super(transport, appPrivateKey, appId, '4A');
  }

  /**
   * Get ICON address by index
   */
  async getAddress(addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(addressIndex);
    return pubKeyToAddress(publicKey);
  }

  /**
   * Sign ICX Transaction.
   */
  async signTransaction(
    transaction: string | Object,
    addressIndex: number,
    publicKey: string,
    confirmCB: Function | undefined = undefined,
    authorizedCB: Function | undefined = undefined
  ) {
    if (publicKey === undefined) publicKey = await this.getPublicKey(addressIndex);
    return signTransaction(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      transaction,
      addressIndex,
      publicKey,
      confirmCB,
      authorizedCB
    );
  }
}
