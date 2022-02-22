import { coin as COIN, error as ERROR, Transport } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import signTransaction from './sign';
import * as types from './config/types';
import * as params from './config/params';

export { types };

export default class XLM extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, true);

    if (!publicKey) {
      throw new ERROR.SDKError(this.getAddress.name, 'public key is undefined');
    }
    return this.getAddressByAccountKey(publicKey);
  }

  async getAddressByAccountKey(publicKey: string): Promise<string> {
    return txUtil.pubKeyToAddress(publicKey);
  }

  async signTransaction(signTxData: types.signTxType): Promise<string> {
    const signature = signTransaction(signTxData, params.TRANSACTION_TYPE.TRANSFER);
    return signature;
  }
}
