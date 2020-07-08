import { coin as COIN, error as ERROR, transport } from '@coolwallet/core';
import { pubKeyToAddress } from './utils';
import signTx from './sign';

type Transport = transport.default;
type protocol = import('./types').protocol

export default class XLM extends COIN.EDDSACoin implements COIN.Coin {
  constructor(transport: Transport, appPrivateKey: string, appId:string) {
    super(transport, appPrivateKey, appId, '94');
  }

  async getAddress(accountIndex: number, protocol: protocol = 'SLIP0010'): Promise<string> {
    if (accountIndex !== 0) {
      throw new ERROR.SDKError(this.getAddress.name, 'Only support address index = 0 for now.');
    }
    const pubKey = await this.getPublicKey(accountIndex, protocol);
    if (!pubKey){
      throw new ERROR.SDKError(this.getAddress.name, 'public key is undefined');
    } 
    return pubKeyToAddress(pubKey);
  }

  /**
   * sign XLM signatureBase with account 0, return signature.
   */
  async signTransaction(
    signatureBase: Buffer,
    accountIndex: number,
    protocol: protocol | undefined,
    confirmCB: Function | undefined,
    authorizedCB: Function | undefined,
  ): Promise<{ r: string; s: string; } | Buffer> {
    if (accountIndex !== 0) {
      throw new ERROR.SDKError(this.signTransaction.name, 'Only support account index = 0 for now.');
    }
    const protocolToUse = protocol || 'SLIP0010';
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
