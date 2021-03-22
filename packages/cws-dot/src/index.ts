/* eslint-disable no-param-reassign */
import { coin as COIN, setting } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import * as dotUtil from './utils/dotUtil';
import * as types from './config/types'
import * as params from "./config/params"; 
import * as scriptUtil from "./utils/scriptUtil";
import * as dotSign from "./sign";


export default class DOT extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE); 
  }


  async getAddress(transport: types.Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.pubKeyToAddress(publicKey);
  }
 
  async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return txUtil.pubKeyToAddress(publicKey);
  }


  async signTransaction(
    signTxData: types.NormalTransferData
  ) {
    const {
      transport, transaction, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script = params.TRANSFER.script + params.TRANSFER.signature;
    const { method, methodString } = dotUtil.getNormalMethod(transaction.method)
    const formatTxData = dotUtil.getFormatNormalTxData(transaction, method);
    const argument = await scriptUtil.getNormalTradeArgument(formatTxData, addressIndex);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey,
      formatTxData
    );

    return txUtil.getSubmitTransaction(transaction.fromAddress, formatTxData, methodString, signature, 4)
  }
  async signBondTransaction(
    signTxData: types.BondData
  ) {
    const {
      transport, transaction, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script = params.BOND.script + params.BOND.signature;
    const { method, methodString } = dotUtil.getNormalMethod(transaction.method)
    const formatTxData = dotUtil.getFormatNormalTxData(transaction, method);
    const argument = await scriptUtil.getNormalTradeArgument(formatTxData, addressIndex);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey,
      formatTxData
    );

    return txUtil.getSubmitTransaction(transaction.fromAddress, formatTxData, methodString, signature, 4)
  }
}
