import { coin as COIN } from '@coolwallet/core';
import { signTransaction } from './sign';
import * as types from './config/types';
import * as params from './config/params';
import * as txUtil from './utils/transactionUtil';

export const ScriptType = types.ScriptType;

export default class ZEN extends COIN.ECDSACoin implements COIN.Coin {
  public addressToOutScript: (address: string) => { scriptType: types.ScriptType; outScript: Buffer; outHash?: Buffer };

  constructor() {
    super(params.COIN_TYPE);
    this.addressToOutScript = txUtil.addressToOutScript;
  }

  async getAddress(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string,
    scriptType: types.ScriptType,
    addressIndex: number
  ): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    const { address } = txUtil.pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
    return address;
  }

  async getAddressAndOutScript(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string,
    scriptType: types.ScriptType,
    addressIndex: number
  ): Promise<{ address: string; outScript: Buffer }> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
  }

  async getAddressAndOutScriptByAccountKey(
    accPublicKey: string,
    accChainCode: string,
    addressIndex: number,
    scriptType: types.ScriptType
  ): Promise<{ address: string; outScript: Buffer }> {
    return this.getAddressAndOutScriptByAccountKeySync(accPublicKey, accChainCode, addressIndex, scriptType);
  }

  getAddressAndOutScriptByAccountKeySync(
    accPublicKey: string,
    accChainCode: string,
    addressIndex: number,
    scriptType: types.ScriptType
  ): { address: string; outScript: Buffer } {
    const publicKey = this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return txUtil.pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
  }

  async signTransaction(signTxData: types.signTxType): Promise<string> {
    for (const input of signTxData.inputs) {
      // eslint-disable-next-line no-await-in-loop
      const pubkey = await this.getPublicKey(
        signTxData.transport,
        signTxData.appPrivateKey,
        signTxData.appId,
        input.addressIndex
      );
      input.pubkeyBuf = Buffer.from(pubkey, 'hex');
    }
    if (signTxData.change) {
      const pubkey = await this.getPublicKey(
        signTxData.transport,
        signTxData.appPrivateKey,
        signTxData.appId,
        signTxData.change.addressIndex
      );
      // eslint-disable-next-line no-param-reassign
      signTxData.change.pubkeyBuf = Buffer.from(pubkey, 'hex');
    }
    return signTransaction(signTxData);
  }
}
