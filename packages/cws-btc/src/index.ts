import { ECDSACoin } from '@coolwallets/coin';
import { pubkeyToP2PKHAddress, pubkeyToP2SHAddress } from './util';

// import { Input, Output, Param } from './types';
// import * as common from './common';
// import { BTC as BTCONFIG } from './constants';

type Transport = import('@coolwallets/transport').default;

export default class BTC extends ECDSACoin {
  public network: any;

  // public params: Param;

  constructor(transport: Transport, appPrivateKey: string, appId: string, network: any) {
    super(transport, appPrivateKey, appId, '00');
    this.network = network;
    // this.params = BTCONFIG.PARAMS;
  }

  /**
   * Get Bitcoin address by index
   */
  async getP2PKHAddress(addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(addressIndex);
    return pubkeyToP2PKHAddress(publicKey, this.network);
  }

  async getP2SHAddress(addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(addressIndex);
    return pubkeyToP2SHAddress(publicKey);
  }

  async signP2SHTransaction(
    txFee: string|number,
    fromAddresses: [string],
    toAddress: string,
    changeAddress: string,
    changeKeyId: string,
    amount: string|number,
    readType: string
  ): Promise<string> {

  }
}
