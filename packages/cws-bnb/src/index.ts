import { coin as COIN, transport} from '@coolwallet/core';
import signTransfer from './sign';
import { publicKeyToAddress } from './util';


type Transfer = import('./types').Transfer;
type PlaceOrder = import('./types').PlaceOrder;
type CancelOrder = import('./types').CancelOrder;
type Transport = transport.default;

export default class BNB extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super('CA');
  }

  /**
   * Get Binance address by index
   */
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return publicKeyToAddress(publicKey);
  }
  /**
   * Sign Binance tansfer transaction.
   */
  async signTransaction(
    transport: Transport, 
    appPrivateKey: string, 
    appId: string, 
    signObj: Transfer,
    addressIndex: number,
    confirmCB: Function | undefined,
    authorizedCB: Function | undefined
  ) {
    const readType = 'CA';
    return signTransfer(
      transport,
      appId,
      appPrivateKey,
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
    transport: Transport,
    appPrivateKey: string,
    appId: string, 
    signObj: PlaceOrder,
    addressIndex: number,
    confirmCB: Function | undefined,
    authorizedCB: Function | undefined
  ) {
    const readType = 'CB';
    return signTransfer(
      transport,
      appId,
      appPrivateKey,
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
    transport: Transport,
    appPrivateKey: string,
    appId: string, 
    signObj: CancelOrder,
    addressIndex: number,
    confirmCB: Function | undefined,
    authorizedCB: Function | undefined
  ) {
    const readType = 'CC';
    return signTransfer(
      transport,
      appId,
      appPrivateKey,
      this.coinType,
      readType,
      signObj,
      addressIndex,
      confirmCB,
      authorizedCB
    );
  }
}
