import { coin as COIN, error as ERROR, Transport } from '@coolwallet/core';
import { signTransaction } from './sign';
import * as types from './config/types';
import * as params from './config/params';
import * as stringUtil from './utils/stringUtil';

export { types };

export default class SOL extends COIN.EDDSACoin implements COIN.Coin {
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
    return stringUtil.pubKeyToAddress(publicKey);
  }

  async signTransaction(signTxData: types.signTxType): Promise<Buffer> {
    const { transaction } = signTxData;
    if ((transaction as types.TransactionArgs).instructions)
      return signTransaction(signTxData, params.TRANSACTION_TYPE.SMART_CONTRACT);
    if ((transaction as types.TransferTransaction).options)
      return signTransaction(signTxData, params.TRANSACTION_TYPE.SPL_TOKEN);
    return signTransaction(signTxData, params.TRANSACTION_TYPE.TRANSFER);
  }
}
