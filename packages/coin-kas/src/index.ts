import { coin as COIN, Transport } from '@coolwallet/core';
import { COIN_TYPE } from './config/param';
import {
  getAddressByPublicKeyOrScriptHash,
  addressToOutScript,
  pubkeyOrScriptHashToPayment,
  getPubkeyOrScriptHash,
} from './utils/address';
import signTransferTransaction from './sign';
import * as types from './config/types';

export default class KAS extends COIN.ECDSACoin implements COIN.Coin {
  public ScriptType: any;
  public addressToOutScript: (address: string) => types.Script;

  constructor() {
    super(COIN_TYPE);
    this.ScriptType = types.ScriptType;
    this.addressToOutScript = addressToOutScript;
  }

  async getAddress(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    scriptType: types.ScriptType,
    addressIndex: number,
    purpose?: number
  ): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex, purpose);
    const { pubkeyOrScriptHash, addressVersion } = getPubkeyOrScriptHash(scriptType, publicKey);
    return getAddressByPublicKeyOrScriptHash(pubkeyOrScriptHash, addressVersion);
  }

  async getAddressAndOutScript(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    scriptType: types.ScriptType,
    addressIndex: number,
    purpose?: number
  ): Promise<types.Payment> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex, purpose);
    const { pubkeyOrScriptHash, addressVersion } = getPubkeyOrScriptHash(scriptType, publicKey);
    return pubkeyOrScriptHashToPayment(pubkeyOrScriptHash, addressVersion);
  }

  async getAddressAndOutScriptByAccountKey(
    accPublicKey: string,
    accChainCode: string,
    addressIndex: number,
    scriptType: types.ScriptType
  ): Promise<types.Payment> {
    const publicKey = this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    const { pubkeyOrScriptHash, addressVersion } = getPubkeyOrScriptHash(scriptType, publicKey);
    return pubkeyOrScriptHashToPayment(pubkeyOrScriptHash, addressVersion);
  }

  async signTransaction(signTxType: types.SignTxType): Promise<string> {
    const { inputs, transport, appPrivateKey, appId, change, scriptType } = signTxType;
    for (const input of inputs) {
      const pubkey = await this.getPublicKey(transport, appPrivateKey, appId, input.addressIndex, input.purposeIndex);
      input.pubkeyBuf = Buffer.from(pubkey, 'hex');
      input.scriptType = scriptType;
    }
    if (change) {
      const pubkey = await this.getPublicKey(transport, appPrivateKey, appId, change.addressIndex, change.purposeIndex);
      change.pubkeyBuf = Buffer.from(pubkey, 'hex');
      change.scriptType = scriptType;
    }
    return signTransferTransaction(signTxType);
  }
}
