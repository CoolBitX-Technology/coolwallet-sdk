import { coin as COIN, error as ERROR } from '@coolwallet/core';
import signTransaction from './signTransaction';
import * as types from './config/types';
import * as params from './config/params';
import * as base58 from 'bs58';

export default class NEAR extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  getAddress = async (transport: types.Transport, appPrivateKey: string, appId: string): Promise<string> => {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId);

    if (!publicKey) {
      throw new ERROR.SDKError(this.getAddress.name, 'public key is undefined');
    }

    return publicKey;
  };

  convertData = (data: types.Input, action: types.Action) => {
    const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = data;
    const { sender, publicKey, receiver, nonce, recentBlockHash } = data.transaction;
    const transaction = { sender, publicKey, receiver, nonce, recentBlockHash, action };
    return { transport, appPrivateKey, appId, transaction, confirmCB, authorizedCB };
  };

  signTransferTransaction = async (data: types.SignTransferTxType): Promise<string> => {
    const action = {
      txnType: types.TxnType.TRANSFER,
      amount: data.transaction.amount,
    };
    const signTxData = this.convertData(data, action);
    return await this.signTransaction(signTxData);
  };

  signStakeTransaction = async (data: types.SignStakeTxType): Promise<string> => {
    const action = {
      txnType: types.TxnType.STAKE,
      amount: data.transaction.amount,
      validatorPublicKey: data.transaction.validatorPublicKey,
    };
    const signTxData = this.convertData(data, action);
    return await this.signTransaction(signTxData);
  };

  signUnstakeTransaction = async (data: types.SignStakeTxType): Promise<string> => {
    data.transaction.amount = '0';
    return await this.signStakeTransaction(data);
  };

  signSmartTransaction = async (data: types.SignSmartTxType): Promise<string> => {
    const action = {
      txnType: types.TxnType.SMART,
      amount: data.transaction.amount,
      gas: data.transaction.gas,
      methodName: data.transaction.methodName,
      methodArgs: data.transaction.methodArgs,
    };
    const signTxData = this.convertData(data, action);
    return await this.signTransaction(signTxData);
  };

  signSCStakeTransaction = async (data: types.SignSCStakeTxType): Promise<string> => {
    const action = {
      txnType: types.TxnType.SCStake,
      amount: data.transaction.amount,
      gas: data.transaction.gas,
    };
    const signTxData = this.convertData(data, action);
    return await this.signTransaction(signTxData);
  };

  signSCUnstakeAllTransaction = async (data: types.SignSCUnstakeAllTxType): Promise<string> => {
    const action = {
      txnType: types.TxnType.SCUnstakeAll,
      gas: data.transaction.gas,
    };
    const signTxData = this.convertData(data, action);
    return await this.signTransaction(signTxData);
  };

  signSCWithdrawAllTransaction = async (data: types.SignSCWithdrawAllTxType): Promise<string> => {
    const action = {
      txnType: types.TxnType.SCWithdrawAll,
      gas: data.transaction.gas,
    };
    const signTxData = this.convertData(data, action);
    return await this.signTransaction(signTxData);
  };

  signSCUnstakeTransaction = async (data: types.SignSCUnstakeTxType): Promise<string> => {
    const action = {
      txnType: types.TxnType.SCUnstake,
      amount: data.transaction.amount,
      gas: data.transaction.gas,
    };
    const signTxData = this.convertData(data, action);
    return await this.signTransaction(signTxData);
  };

  signSCWithdrawTransaction = async (data: types.SignSCWithdrawTxType): Promise<string> => {
    const action = {
      txnType: types.TxnType.SCWithdraw,
      amount: data.transaction.amount,
      gas: data.transaction.gas,
    };
    const signTxData = this.convertData(data, action);
    return await this.signTransaction(signTxData);
  };

  signTransaction = async (signTxData: types.SignTxType): Promise<string> => {
    if (!signTxData.transaction.sender) {
      const publicKey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId);
      signTxData.transaction.sender = publicKey;
    }
    if (!signTxData.transaction.publicKey) {
      signTxData.transaction.publicKey = base58.encode(Buffer.from(signTxData.transaction.sender, 'hex'));
    }
    if (!signTxData.transaction.receiver) {
      signTxData.transaction.receiver = signTxData.transaction.sender;
    }
    if (signTxData.transaction.action.txnType === types.TxnType.SMART) {
      if (!signTxData.transaction.action.amount) {
        signTxData.transaction.action.amount = '0';
      }
    }

    return await signTransaction(signTxData);
  };
}
