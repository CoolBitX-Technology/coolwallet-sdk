/* eslint-disable no-param-reassign */
import { coin as COIN, utils, config } from '@coolwallet/core';
import { accountKeyToAddress } from './utils';
import { ScriptType, signTxType, Transport } from './config/types';

// import * as params from './config/params';
// import * as ethSign from './sign';
// import * as types from './config/types';
// import * as scriptUtils from './utils/scriptUtils';

export default class ADA implements COIN.Coin {
  accPublicKey: string;
  accChainCode: string;

  constructor() {
    this.accPublicKey = '';
    this.accChainCode = '';
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const node = await this.getAccountPubKeyAndChainCode(transport, appPrivateKey, appId);
    const address = accountKeyToAddress(Buffer.from(node.accountPublicKey, 'hex'), addressIndex);
    return address;
  }

  async getAccountPubKeyAndChainCode(
    transport: Transport,
    appPrivateKey: string,
    appId: string
  ): Promise<{ accountPublicKey: string; accountChainCode: string }> {
    if (this.accPublicKey === '' || this.accChainCode === '') {
      const path = await utils.getFullPath({
        pathType: config.PathType.BIP32ED25519,
        pathString: "1852'/1815'/0'",
      });
      const accountPublicKey = await COIN.getAccountExtKeyFromSE(transport, appId, appPrivateKey, path);
      const accBuf = Buffer.from(accountPublicKey, 'hex');
      this.accPublicKey = accBuf.slice(0, 32).toString('hex');
      this.accChainCode = accBuf.slice(32).toString('hex');
    }
    return { accountPublicKey: this.accPublicKey, accountChainCode: this.accChainCode };
  }
}
