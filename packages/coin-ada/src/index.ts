/* eslint-disable no-param-reassign */
import {
  coin as COIN, transport as Transport, utils, config
} from '@coolwallet/core';
import { pubKeyToAddress } from './utils';

const bip32Edd25519 = require('bip32-ed25519');

// import * as params from './config/params';
// import * as ethSign from './sign';
// import * as types from './config/types';
// import * as scriptUtils from './utils/scriptUtils';

export default class ADA implements COIN.Coin {

  getAddress = async (
    transport: Transport.default,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> => {
    const path = await utils.getAccountPath({
      pathType: config.PathType.BIP32ED25519,
      purpose: '8000073C',
      coinType: '80000717',
    });
    const accountPublicKey = COIN.getAccountExtKeyFromSE(transport, appId, appPrivateKey, path);
    console.log('accountPublicKey :', accountPublicKey);
    return accountPublicKey;
    // return pubKeyToAddress(publicKey);
  }

  // async getAddressByAccountKey(
  //   accPublicKey: string,
  //   accChainCode: string,
  //   addressIndex: number
  // ): Promise<string> {
  //   const publicKey = await this.getAddressPublicKey(
  //     accPublicKey, accChainCode, addressIndex
  //   );
  //   return pubKeyToAddress(publicKey);
  // }

  signTransaction = async (): Promise<string> => 'test';
}
