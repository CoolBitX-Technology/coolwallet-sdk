/* eslint-disable no-param-reassign */
import { coin as COIN } from '@coolwallet/core';
import { accountKeyToAddress, derivePubKeyFromAccountToIndex } from './utils';
import { getPath } from './utils/scriptUtil';
import { signTxType, Transport } from './config/types';
import { signTransaction } from './sign';

export default class ADA implements COIN.Coin {
  accPublicKey: string;
  accChainCode: string;

  constructor() {
    this.accPublicKey = '';
    this.accChainCode = '';
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    if (this.accPublicKey === '' || this.accChainCode === '') {
      const path = await getPath();
      const accountPublicKey = await COIN.getAccountExtKeyFromSE(transport, appId, appPrivateKey, path);
      const accBuf = Buffer.from(accountPublicKey, 'hex');
      this.accPublicKey = accBuf.slice(0, 32).toString('hex');
      this.accChainCode = accBuf.slice(32).toString('hex');
    }
    const address = accountKeyToAddress(Buffer.from(this.accPublicKey, 'hex'), addressIndex);
    return address;
  }

  async signTransaction(signTxData: signTxType): Promise<string> {
    if (this.accPublicKey === '' || this.accChainCode === '') {
      const path = await getPath();
      const accountPublicKey = await COIN.getAccountExtKeyFromSE(
        signTxData.transport,
        signTxData.appId,
        signTxData.appPrivateKey,
        path
      );
      const accBuf = Buffer.from(accountPublicKey, 'hex');
      this.accPublicKey = accBuf.slice(0, 32).toString('hex');
      this.accChainCode = accBuf.slice(32).toString('hex');
    }
    signTxData.input.pubkeyBuf = derivePubKeyFromAccountToIndex(
      Buffer.from(this.accPublicKey, 'hex'),
      0,
      signTxData.input.addressIndex
    );

    if (signTxData.change) {
      signTxData.change.pubkeyBuf = derivePubKeyFromAccountToIndex(
        Buffer.from(this.accPublicKey, 'hex'),
        0,
        signTxData.change.addressIndex
      );
    }
    return signTransaction(signTxData);
  }
}
