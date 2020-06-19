import { coin as COIN, transport } from "@coolwallet/core";
import * as xrpSign from "./sign";
import * as xrpUtil from "./util";

type Transport = transport.default;
type Payment = import("./types").Payment;

export default class XRP extends COIN.ECDSACoin implements COIN.Coin{
  constructor(transport: Transport, appPrivateKey: string, appId: string) {
    super(transport, appPrivateKey, appId, "90");
  }

  /**
   * Get XRP address by index
   */
  async getAddress(addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(addressIndex);
    return xrpUtil.pubKeyToAddress(publicKey);
  }

  /**
   * Sign XRP Payment.
   * @description TransactionType must be 'Payment', Flags must be 2147483648;
   */
  async signTransaction(
    payment: Payment,
    addressIndex: number,
    confirmCB?: Function | undefined,
    authorizedCB?: Function | undefined
  ) {
    payment.TransactionType = "Payment";
    payment.Flags = 2147483648;
    if (!payment.SigningPubKey) {
      payment.SigningPubKey = await this.getPublicKey(addressIndex);
      payment.SigningPubKey = payment.SigningPubKey.toUpperCase();
    }
    if (!payment.Account) {
      payment.Account = xrpUtil.pubKeyToAddress(payment.SigningPubKey);
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
