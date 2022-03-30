import { coin as COIN, error as ERROR, Transport } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import { signTransaction } from './sign';
import * as types from './config/types';
import * as params from './config/params';
import { getTxType } from './utils/stringUtil';

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
    return txUtil.pubKeyToAddress(publicKey);
  }

  async signTransaction(signTxData: types.signTxType): Promise<Buffer> {
    const { transaction } = signTxData;

    const txType = getTxType(transaction);

    switch (txType) {
      case params.TRANSACTION_TYPE.SMART_CONTRACT:
        break;
      case params.TRANSACTION_TYPE.SPL_TOKEN:
        (signTxData.transaction.options as types.TransactionOptions).programId = params.TOKEN_PROGRAM_ID;
        break;
      default:
        signTxData.transaction.options = { programId: params.SYSTEM_PROGRAM_ID };
        break;
    }

    return signTransaction(signTxData, txType);
  }
}
