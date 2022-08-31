import { coin as COIN } from '@coolwallet/core';
import { getPath, publicKeyToAuthenticationKey } from './utils';
import * as types from './config/types';
import * as params from './config/params';

export default class APTOS extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  getAddress = () => {
    throw new Error('getAddress is not supported for aptos, please use getAuthKey instead');
  };

  getAuthKey = async (
    transport: types.Transport, appPrivateKey: string, appId: string, addressIndex: number
  ): Promise<string> => {
    const path = getPath(addressIndex);
    const publicKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
    const authenticationKey = publicKeyToAuthenticationKey(publicKey);
    return authenticationKey;
  };

  signTransaction = async (signTxData: types.SignTxType): Promise<string> => {
    return '';
  };
}
