import { coin as COIN, Transport, utils, config, apdu, tx } from '@coolwallet/core';
import BigNumber from "bignumber.js";
import * as minaSign from './sign';
import * as txUtil from './utils/trancsactionUtil';
import * as types from './config/types';
import * as params from './config/params';

export default class MINA implements COIN.Coin {

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    // const accPubkey = await this.getAccountPubKey(transport, appPrivateKey, appId);
    // const address = this.getAddressByAccountKey(accPubkey, addressIndex);
    return "";
  }

  /**
   * Sign MINA Payment.
   * @description TransactionType must be 'Payment' 0x00;
   */
  async signTransaction(signTxData: types.signTxType) {
    const payment = signTxData.payment;

    payment.txType = 0x00; // PAYMENT;
    payment.validUntil = payment.validUntil || 4294967295;

    const decimals = 9;
  
    const decimal = new BigNumber(10).pow(decimals)
    const sendFee = new BigNumber(payment.fee).multipliedBy(decimal).toNumber()
    const sendAmount = new BigNumber(payment.amount).multipliedBy(decimal).toNumber()
  
    payment.fee = sendFee;
    payment.amount = sendAmount;

    return minaSign.signPayment(signTxData, payment);
  }

  /**
   * Sign MINA Payment.
   * @description TransactionType must be 'Payment' 0x00;
   */
  async signDelegation(signTxData: types.signTxType) {
    const payment = signTxData.payment;

    payment.txType = 0x01; // DELEGATION;
    payment.validUntil = payment.validUntil || 4294967295;

    return minaSign.signDelegation(signTxData, payment);
  }
}
