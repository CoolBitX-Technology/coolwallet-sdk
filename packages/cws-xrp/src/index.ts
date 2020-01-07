import { ECDSACoin } from '@coolwallets/coin';
import * as xrpSign from './sign';
import { pubKeyToAddress } from './util';

type Transport = import('@coolwallets/transport').default;
type Payment = import('./types').Payment

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
   * Sign XRP Payment.
   * @description TransactionType must be 'Payment', Flags must be 2147483648;
   */
  async signPayment(
    payment: Payment,
    addressIndex: number,
    confirmCB: Function | undefined = undefined,
    authorizedCB: Function | undefined = undefined
  ) {
    if (!payment.SigningPubKey) {
      // eslint-disable-next-line no-param-reassign
      payment.SigningPubKey = await this.getPublicKey(addressIndex);
    }
    return xrpSign.signPayment(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      payment,
      addressIndex,
      confirmCB,
      authorizedCB
    );
  }
}
