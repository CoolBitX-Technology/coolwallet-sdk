import { coin as COIN, Transport, utils } from '@coolwallet/core';
import { COIN_TYPE } from './config/param';
import { PathType } from '@coolwallet/core/lib/config';
import { fromBase64 } from './bcs/b64';
import { Ed25519PublicKey } from './cryptography/ed25519-publickey';

export default class Sui extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(COIN_TYPE);
  }

  getAddressFromPublic(publicKey: string) {
    const pk = fromBase64(publicKey);
    const p = new Ed25519PublicKey(pk);
    return p.toSuiAddress();
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/784'/0'/0'/${addressIndex}'` });
    const publicKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
    const base64 = Buffer.from(publicKey, 'hex').toString('base64');
    return this.getAddressFromPublic(base64);
  }

  async signTransaction(): Promise<string> {
    throw new Error('Not implemented');
  }
}
