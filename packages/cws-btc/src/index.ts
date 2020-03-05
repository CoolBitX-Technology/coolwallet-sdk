import { ECDSACoin } from '@coolwallets/coin';
import { pubkeyToP2PKHAddress, pubkeyToP2SHAddress } from './util';

type Transport = import('@coolwallets/transport').default;

export default class BTC extends ECDSACoin {
  public network: any;

  constructor(transport: Transport, appPrivateKey: string, appId: string, network: any) {
    super(transport, appPrivateKey, appId, '00');
    this.network = network;
  }

  /**
   * Get Bitcoin address by index
   */
  async getP2PKHAddress(addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(addressIndex);
    return pubkeyToP2PKHAddress(publicKey);
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
