import { ECDSACoin } from '@coolwallets/coin';
import signTransaction from './sign';
import { publicKeyToAddress } from './util';

type Transport = import('@coolwallets/transport').default;

type Transfer = import('./types').Transfer;
type PlaceOrder = import('./types').PlaceOrder;
type CancelOrder = import('./types').CancelOrder;

export default class BNB extends ECDSACoin {
  constructor(transport: Transport, appPrivateKey: string, appId: string) {
    super(transport, appPrivateKey, appId, 'CA');
  }

  /**
   * Get Binance address by index
   */
  async getAddress(addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(addressIndex);
    return publicKeyToAddress(publicKey);
  }

  /**
   * Sign Binance tansfer transaction.
   */
  async signTransfer(
    signObj: Transfer,
    addressIndex: number,
    confirmCB: Function | undefined,
    authorizedCB: Function | undefined
  ) {
    const readType = 'CA';
    return signTransaction(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      readType,
      signObj,
      addressIndex,
      confirmCB,
      authorizedCB
    );
  }

  /**
   * Sign PlaceOrder Transaction
   */
  async placeOrder(
    signObj: PlaceOrder,
    addressIndex: number,
    confirmCB: Function | undefined,
    authorizedCB: Function | undefined
  ) {
    const readType = 'CB';
    return signTransaction(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      readType,
      signObj,
      addressIndex,
      confirmCB,
      authorizedCB
    );
  }

  /**
   * Sign CancelOrder Transaction
   */
  async cancelOrder(
    signObj: CancelOrder,
    addressIndex: number,
    confirmCB: Function | undefined,
    authorizedCB: Function | undefined
  ) {
    const readType = 'CC';
    return signTransaction(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      readType,
      signObj,
      addressIndex,
      confirmCB,
      authorizedCB
    );
  }
}
