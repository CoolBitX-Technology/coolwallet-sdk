
import { coin as COIN, Transport } from '@coolwallet/core';
import { COIN_TYPE } from './config/param';
import { getAddressByPublicKey, addressToOutScript, pubkeyToPayment } from './utils/address';
import signTransferTransaction from './sign';
import { Script, ScriptType, SignTxType } from './config/types';

export default class KAS extends COIN.ECDSACoin implements COIN.Coin {
  public addressToOutScript: (address: string) => Script;
  
  constructor() {
    super(COIN_TYPE);
    this.addressToOutScript = addressToOutScript;
  }

  async getAddress(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    scriptType: ScriptType,
    addressIndex: number,
    purpose?: number
  ): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex, purpose);
    return getAddressByPublicKey(publicKey, scriptType);
  }

  async getAddressAndOutScript(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    scriptType: ScriptType,
    addressIndex: number,
    purpose?: number
  ): Promise<{ address: string; outScript: Buffer }> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex, purpose);
    return pubkeyToPayment(publicKey, scriptType);
  }

  async getAddressAndOutScriptByAccountKey(
    accPublicKey: string,
    accChainCode: string,
    addressIndex: number,
    scriptType: ScriptType
  ): Promise<{ address: string; outScript: Buffer }> {
    const publicKey = this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return pubkeyToPayment(publicKey, scriptType);
  }

  async signTransaction(signTxType: SignTxType): Promise<string> {
    const { inputs, transport, appPrivateKey, appId, change } = signTxType;
    for (const input of inputs) {
      const pubkey = await this.getPublicKey(
        transport,
        appPrivateKey,
        appId,
        input.addressIndex,
        input.purposeIndex
      );
      input.pubkeyBuf = Buffer.from(pubkey, 'hex');
    }
    if (change) {
      const pubkey = await this.getPublicKey(
        transport,
        appPrivateKey,
        appId,
        change.addressIndex,
        change.purposeIndex
      );
      change.pubkeyBuf = Buffer.from(pubkey, 'hex');
    }
    return signTransferTransaction(signTxType);
  }
}
