import { coin as COIN, transport } from "@coolwallet/core";
import * as xrpSign from "./sign";
import * as xrpUtil from "./util";
import { Transport, signTxType, Payment } from "./types";
export default class XRP extends COIN.ECDSACoin implements COIN.Coin{
  constructor() {
    super("90");
  }

  /**
   * Get XRP address by index
   */
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return xrpUtil.pubKeyToAddress(publicKey);
  }

  /**
   * Sign XRP Payment.
   * @description TransactionType must be 'Payment', Flags must be 2147483648;
   */
  async signTransaction(
    signTxData: signTxType
  ) {
    const payment = signTxData.payment;

    console.log(payment)
    console.log(signTxData.payment)

    payment.TransactionType = "Payment";
    payment.Flags = 2147483648;
    if (!payment.SigningPubKey) {
      payment.SigningPubKey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, signTxData.addressIndex);
      payment.SigningPubKey = payment.SigningPubKey.toUpperCase();
    }
    if (!payment.Account) {
      payment.Account = xrpUtil.pubKeyToAddress(payment.SigningPubKey);
    }

    return xrpSign.signPayment(
      signTxData,
      this.coinType,
      payment,
    );
  }
}
