import { ECDSACoin } from '@coolwallets/coin';
import signTransaction from './sign';

type Transport = import('@coolwallets/transport').default;

export default class BNB extends ECDSACoin {
  constructor(transport: Transport, appPrivateKey: string, appId: string) {
    super(transport, appPrivateKey, appId, 'CA');
  }

  /**
   * Sign Binance tansfer transaction.
   */
  async signTransfer(
    signObj: any,
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
   * Sign Order operation on Binance
   */
  async makeOrder(
    signObj: any,
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
   * Sign Cancel operation on Binance
   */
  async cancelOrder(
    signObj: any,
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
