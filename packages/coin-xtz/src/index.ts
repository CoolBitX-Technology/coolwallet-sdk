/* eslint-disable no-param-reassign */
import { coin as COIN, setting } from '@coolwallet/core';
import * as codecUtil from './utils/codecUtil';
import * as txUtil from './utils/transactionUtil';
import * as xtzUtil from './utils/xtzUtil';
import * as types from './config/types';
import * as params from './config/params';
import * as argUtil from './utils/argumentUtil';
import * as xtzSign from './sign';

export default class XTZ extends COIN.EDDSACoin implements COIN.Coin {

  constructor() {
    super(params.COIN_TYPE);
  }

  async getPublicKeyHash(transport: types.Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId);//, addressIndex);
    return codecUtil.pubKeyHexToHash(publicKey);
  }

  async getAddress(transport: types.Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId);//, addressIndex);
    return codecUtil.pubKeyToAddress(publicKey);
  }
 
  async signTransaction(
    signTxData: types.SignTxData,
    operation: types.xtzTransaction
  ) {
    const {
      transport, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script = params.TRANSACTION.script + params.TRANSACTION.signature;
    const argument = await argUtil.getTransferTransactionArgument(operation);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId);//, addressIndex);

    const signature = await xtzSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );
    const formatTxData = xtzUtil.getFormatTransfer(operation); 
    return txUtil.getSubmitTransaction(formatTxData, signature);
  }

  async signReveal(
    signTxData: types.SignTxData,
    operation: types.xtzReveal
  ) {
    const {
      transport, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script = params.REVEAL.script + params.REVEAL.signature;
    const argument = await argUtil.getRevealArgument(operation);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId);//, addressIndex);

    const signature = await xtzSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );
    const formatTxData = xtzUtil.getFormatReveal(operation); 
    return txUtil.getSubmitTransaction(formatTxData, signature);
  }

  async signOrigination(
    signTxData: types.SignTxData,
    operation: types.xtzOrigination
  ) {
    const {
      transport, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script =  params.ORIGINATION.script + params.ORIGINATION.signature;
    const argument = await argUtil.getOriginationArgument(operation);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId);//, addressIndex);

    const signature = await xtzSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );
    const formatTxData = xtzUtil.getFormatOrigination(operation); 
    return txUtil.getSubmitTransaction(formatTxData, signature);
  }

  async signDelegation(
    signTxData: types.SignTxData,
    operation: types.xtzDelegation
  ) {
    const {
      transport, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script = params.DELEGATION.script + params.DELEGATION.signature;
    const argument = await argUtil.getDelegationArgument(operation);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId);//, addressIndex);

    const signature = await xtzSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );
    const formatTxData = operation.delegate ? xtzUtil.getFormatDelegation(operation) : xtzUtil.getFormatUndelegation(operation); 
    return txUtil.getSubmitTransaction(formatTxData, signature);
  }
}