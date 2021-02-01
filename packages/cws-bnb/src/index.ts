import { coin as COIN } from '@coolwallet/core'; 
import { walletConnectSignature, transferSignature } from './sign';
import { getTransferArgument, getCancelOrderArgument, getPlaceOrderArgument, getTokenArgument } from './utils/scriptUtil';
import { signType, signCancelOrderType, signPlaceOrderType } from './config/types'
import * as param from './config/param'
import * as txUtil from "./utils/transactionUtil";
import * as Types from './config/types'
import { TOKEN_SIGS } from './config/tokenType'
export default class BNB extends COIN.ECDSACoin implements COIN.Coin {
  public Types: any;

  constructor() {
    super(param.COIN_TYPE);
    this.Types = Types;
  }

  /**
   * Get Binance address by index
   */
  async getAddress(transport: Types.Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.publicKeyToAddress(publicKey);
  }


  /**
   * Sign Binance tansfer transaction.
   */
  async signTransaction(
    signData: signType,
  ): Promise<string> {
    
    const denom = signData.signObj.msgs[0].inputs[0].coins[0].denom;

    if ("BNB" === denom){
      return this.signTansferTransaction(signData)
    }

    let tokenSignature;
    for (let tokenInfo of TOKEN_SIGS) { // get tokenSignature
      if (denom.toUpperCase() === tokenInfo.symbol) {
        tokenSignature = tokenInfo.signature;
        break;
      }
    }
    if (tokenSignature) {
      return await this.signTokenTransaction(signData, denom, tokenSignature); // 內建
    } else {
      return await this.signTokenTransaction(signData, denom); // 自建
    }
  }

  /**
 * Sign Binance tansfer transaction.
 */
  async signTansferTransaction(
    signData: signType
  ): Promise<string> {
    const script = param.TRANSFER.script + param.TRANSFER.signature;
    const argument = await getTransferArgument(signData.signObj, signData.addressIndex);
    return transferSignature(
      signData,
      'BNB',
      script,
      argument
    );
  }

  /**
 * Sign Binance token transaction.
 */
  async signTokenTransaction(
    signData: signType, denom: string, tokenSignature: string = ''
  ): Promise<string> {
    const script = param.BEP2Token.script + param.BEP2Token.signature;
    const argument = await getTokenArgument(signData.signObj, denom, tokenSignature, signData.addressIndex);
    return transferSignature(
      signData,
      denom,
      script,
      argument
    );
  }

  /**
   * Sign PlaceOrder Transaction
   */
  async signPlaceOrder(
    signData: signPlaceOrderType
  ): Promise<string> {
    const script = param.PlaceOrder.script + param.PlaceOrder.signature;
    const argument = await getPlaceOrderArgument(signData.signObj, signData.addressIndex);
    const signature = await walletConnectSignature(
      signData.transport,
      signData.appId,
      signData.appPrivateKey,
      script,
      argument,
      signData.confirmCB,
      signData.authorizedCB
    );
    return signature
  }

  /**
   * Sign CancelOrder Transaction
   */
  async signCancelOrder(
    signData: signCancelOrderType
  ): Promise<string> {
    const script = param.CancelOrder.script + param.CancelOrder.signature;
    const argument = await getCancelOrderArgument(signData.signObj, signData.addressIndex);
    const signature = await walletConnectSignature(
      signData.transport,
      signData.appId,
      signData.appPrivateKey,
      script,
      argument,
      signData.confirmCB,
      signData.authorizedCB
    );
    return signature
  }

}
