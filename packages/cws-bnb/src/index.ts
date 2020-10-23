import { coin as COIN, transport } from '@coolwallet/core';
import { walletConnectSignature, transferSignature } from './sign';
import { publicKeyToAddress } from './util';
import { signType } from './types'
import  * as Types from './types'

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
    return transferSignature(
      signData,
      Types.TransactionType.TRANSFER,
      readType,
    );
  }

  /**
   * Sign PlaceOrder Transaction
   */
  async signPlaceOrder(
    signData: signType
  ): Promise<{
    signature: string,
    publicKey: string
  }> {
    const readType = 'CB';
    const signature = await walletConnectSignature(
      signData,
      Types.TransactionType.PLACE_ORDER,
      readType
    );
    const publicKey = await this.getFullPubKey(signData.signPublicKey.toString('hex'));
    return { signature, publicKey }
  }

  /**
   * Sign CancelOrder Transaction
   */
  async signCancelOrder(
    signData: signType
  ): Promise<{
    signature: string,
    publicKey: string
  }> {
    const readType = 'CC';
    const signature = await walletConnectSignature(
      signData,
      Types.TransactionType.PLACE_ORDER,
      readType
    );
    const publicKey = await this.getFullPubKey(signData.signPublicKey.toString('hex'));
    return { signature, publicKey }
  }
}
