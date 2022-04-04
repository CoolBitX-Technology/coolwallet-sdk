import { coin as COIN, error as ERROR } from '@coolwallet/core';
import signTransaction from './sign';
// import * as txUtil from "./utils/transactionUtils";
import * as types from './config/types';
import * as params from './config/params';

export default class NEAR extends COIN.EDDSACoin implements COIN.Coin {
  constructor(/*type: string*/) {
    super(params.COIN_TYPE);
  }

  async getAddress(transport: types.Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
/*    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    if (!publicKey) {
      throw new ERROR.SDKError(this.getAddress.name, 'public key is undefined');
    }
    return txUtil.publicKeyToAddress(publicKey);
  */  
    return new Promise<string>(resolve => { resolve('') })
  }
  
  // sign NEAR signatureBase with account 0, return signature.
  
  async signTransaction(signTxData: types.SignTxType): Promise<string> {

    const signature = await signTransaction(signTxData);

    return signature;
  }
}
