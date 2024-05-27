import { coin as COIN, utils, config, Transport } from '@coolwallet/core';
import * as AddressUtils from './utils/addressUtils';

export default class TON implements COIN.Coin {
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const fullPath = utils.getFullPath({ pathString: `44'/607'/${addressIndex}'`, pathType: config.PathType.SLIP0010 });
    const publicKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, fullPath); // need to connect card
    const address = await AddressUtils.getAddressByPublicKey(publicKey);
    return address;
  }

  async signTransaction(): Promise<string> {
    throw new Error(`TON.signTransaction not implemented.`);
  }
}
