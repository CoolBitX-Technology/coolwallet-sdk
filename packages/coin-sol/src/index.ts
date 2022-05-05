import { coin as COIN, error as ERROR, Transport, utils } from '@coolwallet/core';
import { signTransaction } from './sign';
import * as types from './config/types';
import * as params from './config/params';
import * as stringUtil from './utils/stringUtil';
import TransactionCreator from './utils/TransactionCreator';
import { PathType } from '@coolwallet/core/lib/config';

export { types, TransactionCreator };

export default class SOL extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
    const publicKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
    console.log('Public Key:', publicKey);
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
    switch (transaction.txType) {
      case params.TRANSACTION_TYPE.SPL_TOKEN:
        return signTransaction(signTxData, params.TRANSACTION_TYPE.SPL_TOKEN);
      case params.TRANSACTION_TYPE.TRANSFER:
        return signTransaction(signTxData, params.TRANSACTION_TYPE.TRANSFER);
      default:
        return signTransaction(signTxData, params.TRANSACTION_TYPE.SMART_CONTRACT);
    }
  }
}
