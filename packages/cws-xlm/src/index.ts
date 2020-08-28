import { coin as COIN, error as ERROR, transport } from '@coolwallet/core';
import { pubKeyToAddress } from './utils';
import signTransaction from './sign';

type Transport = transport.default;
type protocol = import('./types').protocol
const accountIndexErrorMsg = 'Only support account index = 0 for now.';
export const coinType = '94'
export default class XLM extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(coinType);
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, accountIndex: number, protocol: protocol = 'SLIP0010'): Promise<string> {
    if (accountIndex !== 0) {
      throw new ERROR.SDKError(this.getAddress.name, accountIndexErrorMsg);
    }
    console.log("protocol: " + protocol)
    console.log("accountIndex: " + accountIndex)
    const pubKey = await this.getPublicKey(transport, appPrivateKey, appId, accountIndex, protocol);
    console.log(pubKey)
    if (!pubKey){
      throw new ERROR.SDKError(this.getAddress.name, 'public key is undefined');
    } 
    return pubKeyToAddress(pubKey);
  }

  /**
   * sign XLM signatureBase with account 0, return signature.
   */
  async signTransaction(
    transport: Transport, 
    appPrivateKey: string, 
    appId: string, 
    signatureBase: Buffer,
    transaction: object, 
    accountIndex: number,
    protocol: protocol | undefined,
    confirmCB: Function | undefined,
    authorizedCB: Function | undefined,
  ): Promise<{ r: string; s: string; } | Buffer> {
    if (accountIndex !== 0) {
      throw new ERROR.SDKError(this.signTransaction.name, accountIndexErrorMsg);
    }
    const protocolToUse = protocol || 'SLIP0010';
    const signature = signTransaction(
      transport,
      appPrivateKey,
      appId,
      this.coinType,
      signatureBase,
      transaction,
      accountIndex,
      protocolToUse,
      confirmCB,
      authorizedCB,
    );

    return signature;
  }
}
