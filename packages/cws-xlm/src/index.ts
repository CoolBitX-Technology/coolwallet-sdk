import { coin as COIN, error as ERROR, utils } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import signTransaction from './sign';
import * as types from './config/types';
import * as params from './config/params';
import { COIN_SPECIES, PROTOCOL } from './config/types'; 
export { COIN_SPECIES, PROTOCOL };


export default class XLM extends COIN.EDDSACoin implements COIN.Coin {
  transfer: { script: string, signature: string};
  constructor(type: String) {
    super(params.COIN_TYPE);

    switch (type) {
      case COIN_SPECIES.KAU:
        this.transfer = params.TRANSFER.KAU;
        break;
      case COIN_SPECIES.KAG:
        this.transfer = params.TRANSFER.KAG;
        break;
      case COIN_SPECIES.XLM:
      default:
        this.transfer = params.TRANSFER.XLM;
    } 
  }

  async getAddress(transport: types.Transport, appPrivateKey: string, appId: string, accountIndex: number, protocol: PROTOCOL = PROTOCOL.SLIP0010): Promise<string> {
    if (accountIndex !== 0) {
      throw new ERROR.SDKError(this.getAddress.name, 'Only support account index = 0 for now.');
    }

    const keyType = protocol === PROTOCOL.BIP44 ? true : false;
    const path = await utils.getPath(params.COIN_TYPE, accountIndex, 3, keyType)
    console.log("path: " + path)

    const pubKey = await this.getPublicKey(transport, appPrivateKey, appId, accountIndex, path);
    console.log("pubkey: " + pubKey)
   
    if (!pubKey) {
      throw new ERROR.SDKError(this.getAddress.name, 'public key is undefined');
    }
    return txUtil.pubKeyToAddress(pubKey);
  }

  async getAddressByAccountKey(publicKey: string): Promise<string> {
    return txUtil.pubKeyToAddress(publicKey);
  }

  /**
   * sign XLM signatureBase with account 0, return signature.
   */
  async signTransaction(
    signTxData: types.signTxType
  ): Promise<{ r: string; s: string; } | Buffer> {
    const protocolToUse = signTxData.protocol || PROTOCOL.SLIP0010;
    console.log("protocolToUse: " + protocolToUse)
    const signature = signTransaction(
      signTxData,
      this.transfer,
      protocolToUse,
    );

    return signature;
  }
}
