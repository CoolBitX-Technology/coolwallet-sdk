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
    const formatTxData = dotUtil.getFormatTxData(transaction);
    const argument = await scriptUtil.getNormalTradeArgument(formatTxData, method, methodString, addressIndex);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
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
    const { method, methodString } = dotUtil.getBondMethod(transaction.method)
    const formatTxData = dotUtil.getFormatTxData(transaction);
    const argument = await scriptUtil.getBondArgument(formatTxData, method, methodString, addressIndex);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );

    return txUtil.getSubmitTransaction(transaction.fromAddress, formatTxData, methodString, signature, 4)
  }

  async signUnondTransaction(
    signTxData: types.UnbondData
  ) {
    const {
      transport, transaction, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script = params.UNBOND.script + params.UNBOND.signature;
    const { method, methodString } = dotUtil.getUnbondMethod(transaction.method)
    const formatTxData = dotUtil.getFormatTxData(transaction);
    const argument = await scriptUtil.getUnbondArgument(formatTxData, method, methodString, addressIndex);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );

    return txUtil.getSubmitTransaction(transaction.fromAddress, formatTxData, methodString, signature, 4)
  }

  async signNominateTransaction(
    signTxData: types.NominateData
  ) {
    const {
      transport, transaction, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script = params.NOMINATE.script + params.NOMINATE.signature;
    const { method, methodString } = dotUtil.getNominateMethod(transaction.method)
    const formatTxData = dotUtil.getFormatTxData(transaction);
    const argument = await scriptUtil.getNominateArgument(formatTxData, method, methodString, addressIndex);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );

    return txUtil.getSubmitTransaction(transaction.fromAddress, formatTxData, methodString, signature, 4)
  }
}
