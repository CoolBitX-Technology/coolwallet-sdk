import { coin as COIN } from '@coolwallet/core';
import { addressToOutScript, pubkeyToAddressAndOutScript } from './utils/transactionUtil';
import { signTransaction } from './sign';
import { ScriptType, signTxType, Transport } from './config/types';
import { COIN_TYPE } from './config/param';

export default class DOGE extends COIN.ECDSACoin implements COIN.Coin {
  public addressToOutScript: (address: string) => { scriptType: ScriptType; outScript: Buffer; outHash?: Buffer };

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
    const { address } = pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
    return address;
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
    return pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
  }

  async getAddressAndOutScriptByAccountKey(
    accPublicKey: string,
    accChainCode: string,
    addressIndex: number,
    scriptType: ScriptType
  ): Promise<{ address: string; outScript: Buffer }> {
    const publicKey = this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
  }

  async signTransaction(signTxData: signTxType): Promise<string> {
    for (const input of signTxData.inputs) {
      // eslint-disable-next-line no-await-in-loop
      const pubkey = await this.getPublicKey(
        signTxData.transport,
        signTxData.appPrivateKey,
        signTxData.appId,
        input.addressIndex,
        input.purposeIndex
      );
      input.pubkeyBuf = Buffer.from(pubkey, 'hex');
    }
    if (signTxData.change) {
      const pubkey = await this.getPublicKey(
        signTxData.transport,
        signTxData.appPrivateKey,
        signTxData.appId,
        signTxData.change.addressIndex,
        signTxData.change.purposeIndex
      );
      // eslint-disable-next-line no-param-reassign
      signTxData.change.pubkeyBuf = Buffer.from(pubkey, 'hex');
    }

    return signTransaction(signTxData);
  }
}
