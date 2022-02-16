import { coin as COIN, error as ERROR, utils } from '@coolwallet/core';
import { Transport } from '@coolwallet/core';
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

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, protocol: PROTOCOL = PROTOCOL.BIP44, deep: number = 3, index: number = 0): Promise<string> {

    const isSLIP0010 = protocol === PROTOCOL.SLIP0010 ? true : false ;
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, index, deep, isSLIP0010);              
    // console.log("🚀 ~ file: index.ts ~ line 32 ~ XLM ~ getAddress ~ publicKey", publicKey)
   
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
  async signTransaction(
    signTxData: types.signTxType
  ): Promise<{ r: string; s: string; } | Buffer> {
    const protocolToUse = signTxData.protocol || PROTOCOL.SLIP0010;
    console.debug("protocolToUse: " + protocolToUse)
    const signature = signTransaction(
      signTxData,
      this.transfer,
      protocolToUse,
    );

    return signature;
  }
}
