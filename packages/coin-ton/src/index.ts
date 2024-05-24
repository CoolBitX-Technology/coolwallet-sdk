import { coin as COIN, utils, config } from '@coolwallet/core';
import { signTxType, Transport } from './config/types';
import { COIN_TYPE } from './config/param';

import bip32 from 'bip32';

export default class TON implements COIN.Coin {
  private async getPublicKey(transport: Transport, appPrivateKey: string, appId: string): Promise<string> {
    // connect card to get publicKey
    const path = await utils.getPath(COIN_TYPE, 0, 3, config.PathType.BIP32, 44); // m/44'/607'/0'
    const decryptedData = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);

    // derive account node
    const accBuf = Buffer.from(decryptedData, 'hex');
    const accPublicKeyBuf = accBuf.subarray(0, 33);
    const accChainCodeBuf = accBuf.subarray(33);
    const accountNode = bip32.fromPublicKey(accPublicKeyBuf, accChainCodeBuf);

    // derive account layer publicKey
    const publicKey = accountNode.publicKey.toString('hex');

    return publicKey;
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId);

    return publicKey;
  }

  async signTransaction(signTxData: signTxType): Promise<string> {
    return '';
  }
}
