import { coin as COIN, error as ERROR } from '@coolwallet/core';
import signTransaction from './signTransaction';
import * as scriptUtil from './utils/scriptUtils';
import * as types from './config/types';
import * as params from './config/params';
import * as base58 from 'bs58';

export default class NEAR extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  getAddress = async(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string
  ): Promise<string> => {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId);

    if (!publicKey) {
      throw new ERROR.SDKError(this.getAddress.name, 'public key is undefined');
    }

    return publicKey;
  }
  
  signTransferTransaction = async(
    signTransferTxData: types.SignTransferTxType
  ): Promise<string> => {

    const { transaction } = signTransferTxData;

    const actionTransfer = {
      txnType: types.TxnType.TRANSFER,
      amount: transaction.amount
    };

    const txnTransfer = {
      sender: transaction.sender,
      publicKey: transaction.publicKey,
      receiver: transaction.receiver,
      nonce: transaction.nonce,
      recentBlockHash: transaction.recentBlockHash,
      action: actionTransfer
    };

    const signTxData = {
      transport: signTransferTxData.transport,
      appPrivateKey: signTransferTxData.appPrivateKey,
      appId: signTransferTxData.appId,
      transaction: txnTransfer,
      confirmCB: signTransferTxData.confirmCB,
      authorizedCB: signTransferTxData.authorizedCB
    }

    return await this.signTransaction(signTxData);
  }

  signStakeTransaction = async(
    signStakeTxData: types.SignStakeTxType
  ): Promise<string> => {

    const { transaction } = signStakeTxData;

    const actionStake = {
      txnType: types.TxnType.STAKE,
      amount: transaction.amount,
      validatorPublicKey: transaction.validatorPublicKey
    };

    const txnStake = {
      sender: transaction.sender,
      publicKey: transaction.publicKey,
      receiver: transaction.receiver,
      nonce: transaction.nonce,
      recentBlockHash: transaction.recentBlockHash,
      action: actionStake
    };

    const signTxData = {
      transport: signStakeTxData.transport,
      appPrivateKey: signStakeTxData.appPrivateKey,
      appId: signStakeTxData.appId,
      transaction: txnStake,
      confirmCB: signStakeTxData.confirmCB,
      authorizedCB: signStakeTxData.authorizedCB
    }

    return await this.signTransaction(signTxData);
  }

  signUnstakeTransaction = async(
    signStakeTxData: types.SignStakeTxType
  ): Promise<string> => {

    signStakeTxData.transaction.amount = '0';
    return await this.signStakeTransaction(signStakeTxData);
  }

  signSmartTransaction = async(
    signSmartTxData: types.SignSmartTxType,
    txnType: types.TxnType = types.TxnType.SMART
  ): Promise<string> => {

    const { transaction } = signSmartTxData;

    const actionSmart = {
      txnType: txnType,
      amount: transaction.amount,
      gas: transaction.gas,
      methodName: transaction.methodName,
      methodArgs: transaction.methodArgs
    };

    const txnSmart = {
      sender: transaction.sender,
      publicKey: transaction.publicKey,
      receiver: transaction.receiver,
      nonce: transaction.nonce,
      recentBlockHash: transaction.recentBlockHash,
      action: actionSmart
    };
    
    const signTxData = {
      transport: signSmartTxData.transport,
      appPrivateKey: signSmartTxData.appPrivateKey,
      appId: signSmartTxData.appId,
      transaction: txnSmart,
      confirmCB: signSmartTxData.confirmCB,
      authorizedCB: signSmartTxData.authorizedCB
    }

    return await this.signTransaction(signTxData);
  }

  signSCStakeTransaction = async(
    signSmartTxData: types.SignSmartTxType
  ): Promise<string> => {

    signSmartTxData.transaction.methodName = 'deposit_and_stake';
    return await this.signSmartTransaction(signSmartTxData, types.TxnType.SCSTAKE);
  }

  signSCUnstakeTransaction = async(
    signSmartTxData: types.SignSmartTxType
  ): Promise<string> => {

    signSmartTxData.transaction.methodName = 'unstake';
    signSmartTxData.transaction.methodArgs = Buffer.from(JSON.stringify({"amount": scriptUtil.convertNear(signSmartTxData.transaction.amount!)}));
    const sign = await this.signSmartTransaction(signSmartTxData, types.TxnType.SCSTAKENOAMOUNT);
    signSmartTxData.transaction.amount = '0';
    return sign;
  }

  signSCUnstakeAllTransaction = async(
    signSmartTxData: types.SignSmartTxType
  ): Promise<string> => {

    signSmartTxData.transaction.methodName = 'unstake_all';
    signSmartTxData.transaction.amount = '0';
    return await this.signSmartTransaction(signSmartTxData, types.TxnType.SCSTAKENOAMOUNT);
  }

  signSCWithdrawTransaction = async(
    signSmartTxData: types.SignSmartTxType
  ): Promise<string> => {

    signSmartTxData.transaction.methodName = 'withdraw'
    signSmartTxData.transaction.methodArgs = Buffer.from(JSON.stringify({"amount": scriptUtil.convertNear(signSmartTxData.transaction.amount!)}));
    const sign = await this.signSmartTransaction(signSmartTxData, types.TxnType.SCSTAKENOAMOUNT);
    signSmartTxData.transaction.amount = '0';
    return sign;
  }

  signSCWithdrawAllTransaction = async(
    signSmartTxData: types.SignSmartTxType
  ): Promise<string> => {

    signSmartTxData.transaction.methodName = 'withdraw_all'
    signSmartTxData.transaction.amount = '0';
    return await this.signSmartTransaction(signSmartTxData, types.TxnType.SCSTAKENOAMOUNT);
  }
  
  signTransaction = async(
    signTxData: types.SignTxType
  ): Promise<string> => {

    if(!signTxData.transaction.sender) {
      const publicKey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId);
      signTxData.transaction.sender = publicKey;
    }
    if(!signTxData.transaction.publicKey) {
      signTxData.transaction.publicKey = base58.encode(Buffer.from(signTxData.transaction.sender, 'hex'));
    }
    if(!signTxData.transaction.receiver) {
      signTxData.transaction.receiver = signTxData.transaction.sender;
    }
    if(signTxData.transaction.action.txnType === types.TxnType.SMART) {
      if(!signTxData.transaction.action.amount) {
        signTxData.transaction.action.amount = '0';
      }
    }

    return await signTransaction(signTxData);;
  }
}
