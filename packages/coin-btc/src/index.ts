import { coin as COIN } from '@coolwallet/core';
import { addressToOutScript, pubkeyToAddressAndOutScript } from './utils/transactionUtil';
import { signBTCTransaction, signUSDTransaction } from './sign';
import { ScriptType, signTxType, signUSDTTxType, Transport } from './config/types';
import { COIN_TYPE } from './config/param';
import { TinySecp256k1Interface } from 'bitcoinjs-lib/src/types';
import * as bitcoin from 'bitcoinjs-lib';

function isNodeEnvironment() {
  return typeof process !== 'undefined' && process.versions && process.versions.node;
}
export default class BTC extends COIN.ECDSACoin implements COIN.Coin {
  private static isInitialized = false;
  public addressToOutScript: (address: string) => { scriptType: ScriptType; outScript: Buffer; outHash?: Buffer };

  constructor(ecc?: TinySecp256k1Interface) {
    super(COIN_TYPE);
    this.addressToOutScript = addressToOutScript;
    if (BTC.isInitialized) {
      return;
    }
    if (isNodeEnvironment()) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodeEcc = require('tiny-secp256k1');
      bitcoin.initEccLib(nodeEcc);
    } else {
      bitcoin.initEccLib(ecc);
    }
    BTC.isInitialized = true;
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
    console.log('publicKey in getAddress', publicKey);
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
