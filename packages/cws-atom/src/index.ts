import { coin as COIN, transport } from '@coolwallet/core';
import * as atomUtil from './util/atomUtil';
import * as scripts from "./config/script";
import * as types from './config/types'
import * as param from './config/param';
import * as sign from './sign';



type Transport = transport.default;

export default class ATOM extends COIN.ECDSACoin implements COIN.Coin {
  public Types: any;

  constructor() {
    super(param.coinType);
    this.Types = types;
  }

  /**
   * Get Cosmos address by index
   */
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return atomUtil.publicKeyToAddress(publicKey);
  }


  /**
   * Sign transaction.
   */
  async signTransaction(
    signData: types.signType,
  ): Promise<string> {
    // const chain_id = signData.signObj.chain_id
    const chain_id = 'cosmoshub-3'
    switch (chain_id) {
      case param.CHAIN_ID.ATOM:
        this.signCosmosTransaction(signData);
        return 'case'
      default:
        return 'default';

    } 
  }

  /**
 * Sign Cosmos tansfer transaction.
 */
  async signCosmosTransaction(
    signData: types.signType,
  ): Promise<{ r: string; s: string; } | Buffer> {
    const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
    const argument = atomUtil.getCosmosArgement(signData.signObj, signData.addressIndex)
    const signature = sign.signTransaction(signData, script, argument )
    return signature;
  }
}
