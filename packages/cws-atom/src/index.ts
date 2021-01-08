import { coin as COIN, transport } from '@coolwallet/core';
import * as atomUtil from './util/atomUtil';
import * as scripts from "./config/script";
import * as types from './config/types'
import * as param from './config/param';
import { TX_TYPE } from './config/param';
import * as sign from './sign';
import { SDKError } from '@coolwallet/core/lib/error';

export { TX_TYPE };

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
    signData: types.SignType,
  ): Promise<string> {
    const chainId = signData.transaction.chainId
    // const chain_id = 'cosmoshub-3'
    switch (chainId) {
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
    signData: types.SignType,
  ): Promise<{ r: string; s: string; } | Buffer> {

    const { transaction, addressIndex } = signData
    const txType = signData.transaction.txType

    let script;
    let argument;
    switch (txType) {
      case param.TX_TYPE.SEND:
        script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
        argument = atomUtil.getCosmosSendArgement(transaction, addressIndex)
        break;
      case param.TX_TYPE.DELEGATE:
        script = scripts.DELEGATE.script + scripts.DELEGATE.signature;
        argument = atomUtil.getCosmosDelgtOrUnDelArgement(transaction, addressIndex)
        break;
      case param.TX_TYPE.UNDELEGATE:
        script = scripts.UNDELEGATE.script + scripts.UNDELEGATE.signature;
        argument = atomUtil.getCosmosDelgtOrUnDelArgement(transaction, addressIndex)
        break;
      case param.TX_TYPE.WITHDRAW:
        script = scripts.WITHDRAW.script + scripts.WITHDRAW.signature;
        argument = atomUtil.getCosmosWithdrawArgement(transaction, addressIndex)
        break;
      default:
        throw new SDKError(this.signCosmosTransaction.name, `not support input tx type ${txType}`);
    } 

    const signature = sign.signTransaction(signData, script, argument )
    return signature;
  }
}
