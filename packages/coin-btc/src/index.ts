import { coin as COIN } from '@coolwallet/core';
import { addressToOutScript, pubkeyToAddressAndOutScript } from './utils/transactionUtil';
import { signBTCTransaction, signUSDTransaction } from './sign';
import { ScriptType, signTxType, signUSDTTxType, Transport } from './config/types';
import { COIN_TYPE } from './config/param';
import { tweak } from './utils/tweakUtil';

export default class BTC extends COIN.ECDSACoin implements COIN.Coin {
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
    let publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex, purpose);
    //if (scriptType === ScriptType.P2TR) { for test
    if (scriptType === ScriptType.P2SH_P2WPKH) {
      publicKey = tweak(publicKey);
    }
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
    let publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex, purpose);
    if (scriptType === ScriptType.P2TR) {
      publicKey = tweak(publicKey);
    }
    return pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
  }

  async getAddressAndOutScriptByAccountKey(
    accPublicKey: string,
    accChainCode: string,
    addressIndex: number,
    scriptType: ScriptType
  ): Promise<{ address: string; outScript: Buffer }> {
    let publicKey = this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    if (scriptType === ScriptType.P2TR) {
      publicKey = tweak(publicKey);
    }
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
      if (signTxData.scriptType === ScriptType.P2TR) {
        input.pubkeyBuf = Buffer.from(tweak(pubkey), 'hex');
      } else {
        input.pubkeyBuf = Buffer.from(pubkey, 'hex');
      }
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
      if (signTxData.scriptType === ScriptType.P2TR) {
        signTxData.change.pubkeyBuf = Buffer.from(tweak(pubkey), 'hex');
      } else {
        signTxData.change.pubkeyBuf = Buffer.from(pubkey, 'hex');
      }
    }
    return signBTCTransaction(signTxData);
  }

  async signUSDTTransaction(signUSDTTxData: signUSDTTxType): Promise<string> {
    const { transport, appId, appPrivateKey } = signUSDTTxData;

    for (const input of signUSDTTxData.inputs) {
      // eslint-disable-next-line no-await-in-loop
      const pubkey = await this.getPublicKey(transport, appPrivateKey, appId, input.addressIndex);
      input.pubkeyBuf = Buffer.from(pubkey, 'hex');
    }

    if (signUSDTTxData.change) {
      const pubkey = await this.getPublicKey(transport, appPrivateKey, appId, signUSDTTxData.change.addressIndex);
      signUSDTTxData.change.pubkeyBuf = Buffer.from(pubkey, 'hex');
    }
    return signUSDTransaction(signUSDTTxData);
  }
}
