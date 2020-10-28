import { coin as COIN, transport } from '@coolwallet/core';
import { walletConnectSignature, transferSignature } from './sign';
import { publicKeyToAddress, getTransferArgument, getCancelOrderArgument, getPlaceOrderArgument, getTokenArgument } from './util';
import { signType, signTokenType, signCancelOrderType, signPlaceOrderType } from './types'
import * as scripts from "./scripts";
import * as Types from './types'

type Transport = transport.default;

export default class BNB extends COIN.ECDSACoin implements COIN.Coin {
  public Types: any;

  constructor() {
    super(Types.coinType);
    this.Types = Types;
  }

  /**
   * Get Binance address by index
   */
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return publicKeyToAddress(publicKey);
  }


  /**
   * Sign Binance tansfer transaction.
   */
  async signTransaction(
    signData: signType
  ): Promise<string> {
    const readType = 'CA';
    const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
    const argument = getTransferArgument(signData.signObj);
    return transferSignature(
      signData,
      script,
      argument
    );
  }

  /**
 * Sign Binance token transaction.
 */
  async signTokenTransaction(
    signData: signTokenType
  ): Promise<string> {
    const script = scripts.BEP2Token.script + scripts.BEP2Token.signature;
    const argument = getTokenArgument(signData.signObj);
    return transferSignature(
      signData,
      script,
      argument
    );
  }

  // /**
  //  * Sign PlaceOrder Transaction
  //  */
  // async signPlaceOrder(
  //   signData: signPlaceOrderType
  // ): Promise<{
  //   signature: string,
  //   publicKey: string
  // }> {
  //   const readType = 'CB';
  //   const script = scripts.PlaceOrder.script + scripts.PlaceOrder.signature;
  //   const argument = getPlaceOrderArgument(signData.signObj);
  //   const signature = await walletConnectSignature(
  //     signData,
  //     script,
  //     argument
  //   );
  //   const publicKey = await this.getFullPubKey(signData.signPublicKey.toString('hex'));
  //   return { signature, publicKey }
  // }

  // /**
  //  * Sign CancelOrder Transaction
  //  */
  // async signCancelOrder(
  //   signData: signCancelOrderType
  // ): Promise<{
  //   signature: string,
  //   publicKey: string
  // }> {
  //   const readType = 'CC';
  //   const script = scripts.CancelOrder.script + scripts.CancelOrder.signature;
  //   const argument = getCancelOrderArgument(signData.signObj);
  //   const signature = await walletConnectSignature(
  //     signData,
  //     script,
  //     argument
  //   );
  //   const publicKey = await this.getFullPubKey(signData.signPublicKey.toString('hex'));
  //   return { signature, publicKey }
  // }
}
