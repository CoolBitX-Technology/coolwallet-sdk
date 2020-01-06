import { ECDSACoin } from '@coolwallets/coin';
import * as xrpSign from './sign';
import { pubKeyToAddress } from './util';

type Transport = import('@coolwallets/transport').default;

export default class XRP extends ECDSACoin {
  constructor(transport: Transport, appPrivateKey: string, appId: string) {
    super(transport, appPrivateKey, appId, '90');
  }

  /**
   * Get XRP address by index
   */
  async getAddress(addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(addressIndex);
    return pubKeyToAddress(publicKey);
  }

  /**
   * Sign XRP Transaction.
   */
  async signTransaction(
    payload: Buffer,
    addressIndex: number,
    confirmCB: Function | undefined = undefined,
    authorizedCB: Function | undefined = undefined
  ) {
    return xrpSign.signTransaction(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      payload,
      addressIndex,
      confirmCB,
      authorizedCB
    );
  }
}
