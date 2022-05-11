import { coin as COIN } from '@coolwallet/core';
import * as minaSign from './sign';
import * as txUtil from './utils/trancsactionUtil';
import * as types from './config/types';
import * as params from './config/params';

export default class MINA extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  /**
   * Get MINA address by index
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
   * Sign MINA Payment.
   * @description TransactionType must be 'Payment', Flags must be 2147483648;
   */
  async signTransaction(signTxData: types.signTxType) {
    const payment = signTxData.payment;

    return minaSign.signPayment(signTxData, payment);
  }
}
