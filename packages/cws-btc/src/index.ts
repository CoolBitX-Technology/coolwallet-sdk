import { core } from '@coolwallets/core';
import { ECDSACoin } from '@coolwallets/coin';
import { pubkeyToP2PKHAddress, pubkeyToP2SHAddress } from './util';

type Input = import('./types').Input;
type Output = import('./types').Output;
type Change = import('./types').Change;

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

  async signP2PKHTransaction(
    inputs: [Input],
    output: Output,
    change: Change,
    confirmCB = null,
    authorizedCB = null,
  ): Promise<string> {

    const signatures = await core.flow.sendDataArrayToCoolWallet(
      this.transport,
      this.appId,
      this.appPrivateKey,
      txDataArray,
      false,
      confirmCB,
      authorizedCB,
      false
    );
  }

  async signP2SHTransaction(
		inputs: [Input],
		output: Output,
    change: Change,
  ): Promise<string> {

  }
}
