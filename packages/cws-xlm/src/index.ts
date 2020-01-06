import { EDDSACoin } from '@coolwallets/coin';
import { pubKeyToAddress } from './utils';
import signTx from './sign';

type Transport = import('@coolwallets/transport').default;
type protocol = import('./types').protocol

export default class XLM extends EDDSACoin {
  constructor(transport: Transport, appPrivateKey: string, appId:string) {
    super(transport, appPrivateKey, appId, '94');
  }

  async getAccount(accountIndex: number, protocol: protocol): Promise<string> {
    const pubKey = await this.getPublicKey(accountIndex, protocol);
    return pubKeyToAddress(pubKey);
  }

  /**
   * sign XLM signatureBase with account 0, return signature.
   */
  async signTransaction(
    signatureBase: Buffer,
    accountIndex: number,
    protocol: protocol | undefined,
    confirmCB = () => {},
    authorizedCB = () => {},
  ) : Promise<Buffer> {
    const protocolToUse = protocol || 'BIP44';

    const signature = signTx(
      this.transport,
      this.appPrivateKey,
      this.appId,
      this.coinType,
      signatureBase,
      accountIndex,
      protocolToUse,
      confirmCB,
      authorizedCB,
    );

    return signature;
  }
}
