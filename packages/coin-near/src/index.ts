import { coin as COIN, error as ERROR, utils, config } from '@coolwallet/core';
import signTransaction from './sign';
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
  
  signTransaction = async(
    signTxData: types.SignTxType
  ): Promise<string> => {

    if(!signTxData.transaction.sender || !signTxData.transaction.publicKey) {
      const publicKey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId);
      if(!signTxData.transaction.sender) {
        signTxData.transaction.sender = publicKey;
      }
      if(!signTxData.transaction.publicKey) {
        signTxData.transaction.publicKey = base58.encode(Buffer.from(publicKey, 'hex'));
      }
    }
    if(!signTxData.transaction.receiver) {
      signTxData.transaction.receiver = signTxData.transaction.sender;
    }
    if(signTxData.transaction.action.txnType === types.TxnType.SMART) {

      if(!signTxData.transaction.action.amount) {
        signTxData.transaction.action.txnType = types.TxnType.SMARTNOAMOUNT;
        signTxData.transaction.action.amount = '0';
      }
    }
    const signature = await signTransaction(signTxData);

    return signature;
  }
}
