import { coin as COIN, transport } from '@coolwallet/core';
import { walletConnectSignature, transferSignature } from './sign';
import { publicKeyToAddress } from './util';
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
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    signObj: Types.Transfer,
    signPublicKey: Buffer,
    addressIndex: number,
    confirmCB: Function | undefined,
    authorizedCB: Function | undefined
  ): Promise<string> {
    const readType = 'CA';
    return transferSignature(
      transport,
      appId,
      appPrivateKey,
      Types.TransactionType.TRANSFER,
      readType,
      signObj,
      signPublicKey,
      addressIndex,
      confirmCB,
      authorizedCB
    );
  }

  /**
   * Sign PlaceOrder Transaction
   */
  async signPlaceOrder(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    signObj: Types.PlaceOrder,
    signPublicKey: {
      x: string;
      y: string;
    },
    addressIndex: number,
    confirmCB: Function | undefined,
    authorizedCB: Function | undefined
  ): Promise<{
    signature: string,
    publicKey: string
  }> {
    const readType = 'CB';
    return walletConnectSignature(
      transport,
      appId,
      appPrivateKey,
      Types.TransactionType.PLACE_ORDER,
      readType,
      signObj,
      signPublicKey,
      addressIndex,
      confirmCB,
      authorizedCB
    );
  }

  /**
   * Sign CancelOrder Transaction
   */
  async signCancelOrder(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    signObj: Types.CancelOrder,
    signPublicKey: {
      x: string;
      y: string;
    },
    addressIndex: number,
    confirmCB: Function | undefined,
    authorizedCB: Function | undefined
  ): Promise<{
    signature: string,
    publicKey: string
  }> {
    const readType = 'CC';
    return walletConnectSignature(
      transport,
      appId,
      appPrivateKey,
      Types.TransactionType.CANCEL_ORDER,
      readType,
      signObj,
      signPublicKey,
      addressIndex,
      confirmCB,
      authorizedCB
    );
  }
}
