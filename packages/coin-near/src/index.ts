import { coin as COIN, error as ERROR, utils, config } from '@coolwallet/core';
import signTransaction from './sign';
import * as scriptUtils from './utils/scriptUtils';
import * as types from './config/types';
import * as params from './config/params';

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

    return scriptUtils.publicKeyToAddress(publicKey);
  }
  
  signTransaction = async(
    signTxData: types.SignTxType
  ): Promise<string> => {

    const signature = await signTransaction(signTxData);

    return signature;
  }
}
