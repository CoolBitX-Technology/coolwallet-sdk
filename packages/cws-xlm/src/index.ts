import { coin as COIN, error as ERROR, transport } from '@coolwallet/core';
import { pubKeyToAddress } from './utils';
import signTransaction from './sign';
import { coinType, COIN_SPECIES, signTxType, PROTOCOL, path_bip44, path_slip0010 } from './types';
import * as scripts from "./scripts";

export { COIN_SPECIES, PROTOCOL };

type Transport = transport.default;
const accountIndexErrorMsg = 'Only support account index = 0 for now.';


export default class XLM extends COIN.EDDSACoin implements COIN.Coin {
  transfer: { script: string, signature: string};
  constructor(type: String) {
    super(coinType);

    switch (type) {
      case COIN_SPECIES.KAU:
        this.transfer = scripts.TRANSFER.KAU;
        break;
      case COIN_SPECIES.KAG:
        this.transfer = scripts.TRANSFER.KAG;
        break;
      case COIN_SPECIES.XLM:
      default:
        this.transfer = scripts.TRANSFER.XLM;
    } 
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, accountIndex: number, protocol: PROTOCOL = PROTOCOL.SLIP0010): Promise<string> {
    if (accountIndex !== 0) {
      throw new ERROR.SDKError(this.getAddress.name, accountIndexErrorMsg);
    }

    const path = protocol === PROTOCOL.BIP44 ? path_bip44 : path_slip0010;

    const pubKey = await this.getPublicKey(transport, appPrivateKey, appId, accountIndex, path, protocol);
    console.log("pubkey: " + pubKey)
   
    if (!pubKey) {
      throw new ERROR.SDKError(this.getAddress.name, 'public key is undefined');
    }
    return pubKeyToAddress(pubKey);
  }

  /**
   * sign XLM signatureBase with account 0, return signature.
   */
  async signTransaction(
    signTxData: signTxType
  ): Promise<{ r: string; s: string; } | Buffer> {
    const protocolToUse = signTxData.protocol || PROTOCOL.SLIP0010;
    console.log("protocolToUse: " + protocolToUse)
    const signature = signTransaction(
      signTxData,
      this.coinType,
      this.transfer,
      protocolToUse,
    );

    return signature;
  }
}
