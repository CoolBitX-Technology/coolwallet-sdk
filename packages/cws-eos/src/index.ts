import { ECDSACoin } from '@coolwallets/coin';
import signTransfer from './sign';

type Transport = import('@coolwallets/transport').default;
type Transaction = import('./types').Transaction;

export default class EOS extends ECDSACoin {
  public chainId: string;

  constructor(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    chainId: undefined | string
  ) {
    super(transport, appPrivateKey, appId, 'C2');
    this.chainId = chainId || 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906';
  }

  /**
   * Get EOS address by index
   */
  // async getAddress(addressIndex: number): Promise<string> {
  //   const publicKey = await this.getPublicKey(addressIndex)
  //   return pubKeyToAddress(publicKey)
  // }

  /**
   * Sign EOS Transaction.
   */
  async signTransaction(
    transaction: Transaction,
    addressIndex: number,
    publicKey: string | undefined = undefined,
    confirmCB: Function | undefined = undefined,
    authorizedCB: Function | undefined = undefined
  ) {
    const publicKeyToUse = publicKey === undefined
      ? await this.getPublicKey(addressIndex)
      : publicKey;

    return signTransfer(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      transaction,
      addressIndex,
      this.chainId,
      publicKeyToUse,
      confirmCB,
      authorizedCB
    );
  }
}
