/* eslint-disable no-param-reassign */
import {
  coin as COIN, transport as Transport, utils, config
} from '@coolwallet/core';
import { accountKeyToAddress } from './utils';

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
    const path = await utils.getFullPath({
      pathType: config.PathType.BIP32ED25519,
      pathString: "1852'/1815'/0'",
    });
    const accountPublicKey = await COIN.getAccountExtKeyFromSE(transport, appId, appPrivateKey, path);
    const address = accountKeyToAddress(Buffer.from(accountPublicKey, 'hex'), addressIndex);
    return address;
  }

  signTransaction = async (): Promise<string> => 'test';
}
