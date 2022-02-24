import { coin as COIN } from '@coolwallet/core';
import * as xrpSign from './sign';
import * as txUtil from './utils/tracsactionUtil';
import * as types from './config/types';
import * as params from './config/params';

export default class XRP extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  /**
   * Get XRP address by index
   */
  async getAddress(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.pubKeyToAddress(publicKey);
  }

  async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return txUtil.pubKeyToAddress(publicKey);
  }

  /**
   * Sign XRP Payment.
   * @description TransactionType must be 'Payment', Flags must be 2147483648;
   */
  async signTransaction(signTxData: types.signTxType) {
    const payment = signTxData.payment;

    payment.TransactionType = 'Payment';
    payment.Flags = 2147483648;
    if (!payment.SigningPubKey) {
      payment.SigningPubKey = await this.getPublicKey(
        signTxData.transport,
        signTxData.appPrivateKey,
        signTxData.appId,
        signTxData.addressIndex
      );
      payment.SigningPubKey = payment.SigningPubKey.toUpperCase();
    }
    if (!payment.Account) {
      payment.Account = txUtil.pubKeyToAddress(payment.SigningPubKey);
    }

    return xrpSign.signPayment(signTxData, payment);
  }
}

