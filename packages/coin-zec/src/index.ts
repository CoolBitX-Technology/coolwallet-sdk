import { coin as COIN } from '@coolwallet/core';
import { signTransaction } from './sign';
import * as types from './config/types';
import * as params from './config/params';
import * as txUtil from './utils/transactionUtil';
import { ScriptType } from './config/types';

export default class ZEC extends COIN.ECDSACoin implements COIN.Coin {
  public ScriptType: any;
  public addressToOutScript: (address: string) => { scriptType: ScriptType; outScript: Buffer; outHash?: Buffer };

  constructor() {
    super(params.COIN_TYPE);
    this.ScriptType = types.ScriptType;
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
  ): Promise<{ address: string }> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
  }

  async getAddressAndOutScriptByAccountKey(
    accPublicKey: string,
    accChainCode: string,
    addressIndex: number,
    scriptType: types.ScriptType
  ): Promise<{ address: string; outScript: Buffer }> {
    const publicKey = this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return txUtil.pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
  }

  async signTransaction(signTxData: types.signTxType): Promise<string> {
    for (const input of signTxData.inputs) {
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
      signTxData.change.pubkeyBuf = Buffer.from(pubkey, 'hex');
    }
    return signTransaction(signTxData);
  }
}
