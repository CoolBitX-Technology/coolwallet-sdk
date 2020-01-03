import * as eosSign from './sign'
import { ECDSACoin } from '@coolwallets/coin'

type Transport = import('@coolwallets/transport').default
type Transaction = import('./types').Transaction

export default class EOS extends ECDSACoin {
  public chain_id:string

  constructor(transport: Transport, appPrivateKey: string, appId: string, chain_id:undefined|string) {
    super(transport, appPrivateKey, appId, '4A')
    this.chain_id = chain_id || 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
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
    transaction:Transaction,
    addressIndex:number,
    publicKey: string | undefined = undefined,
    confirmCB: Function|undefined = undefined,
    authorizedCB: Function| undefined = undefined
  ) {
    if (publicKey===undefined) publicKey = await this.getPublicKey(addressIndex)
    return await eosSign.signTransfer(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      transaction,
      addressIndex,
      this.chain_id,
      publicKey,
      confirmCB,
      authorizedCB
    )
  }
}
