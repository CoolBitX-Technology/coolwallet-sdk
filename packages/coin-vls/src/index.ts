import { coin as COIN, error as ERROR } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import signTransaction from './sign';
import * as types from './config/types';
import * as params from './config/params';
import { PROTOCOL } from './config/types';

export default class XLM extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  async getAddress(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string,
    protocol: PROTOCOL = PROTOCOL.BIP44
  ): Promise<string> {
    const isSLIP0010 = protocol === PROTOCOL.SLIP0010 ? true : false;
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, isSLIP0010);

    if (!publicKey) {
      throw new ERROR.SDKError(this.getAddress.name, 'public key is undefined');
    }
    return txUtil.pubKeyToAddress(publicKey);
  }

  async getAddressByAccountKey(publicKey: string): Promise<string> {
    return txUtil.pubKeyToAddress(publicKey);
  }

  /**
   * sign XLM signatureBase with account 0, return signature.
   */
  async signTransaction(signTxData: types.signTxType): Promise<{ r: string; s: string } | Buffer> {
    const protocolToUse = signTxData.protocol || PROTOCOL.SLIP0010;
    console.debug('protocolToUse: ' + protocolToUse);
    const signature = signTransaction(signTxData, params.TRANSFER.VLS, protocolToUse);

    return signature;
  }
}
