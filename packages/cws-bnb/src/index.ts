import { coin as COIN, transport} from '@coolwallet/core';
import signTransfer from './sign';
import { publicKeyToAddress } from './util';


type Transfer = import('./types').Transfer;
type PlaceOrder = import('./types').PlaceOrder;
type CancelOrder = import('./types').CancelOrder;
type Transport = transport.default;

export default class BNB extends COIN.ECDSACoin implements COIN.Coin {
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
  async signTransaction(
    signObj: Transfer,
    addressIndex: number,
    confirmCB: Function | undefined,
    authorizedCB: Function | undefined
  ) {
    const readType = 'CA';
    return signTransfer(
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
    return signTransfer(
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
    return signTransfer(
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
