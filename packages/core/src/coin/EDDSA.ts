import { getPublicKeyByPath } from './derive';
import Transport from '../transport';
import * as utils from '../utils/index';
import { PathType } from '../config/param';

export default class EDDSACoin {
  coinType: string;

  constructor(coinType: string) {
    this.coinType = coinType;
    this.getPublicKey = this.getPublicKey.bind(this);
  }

  /**
   * For EdDSA based coins
   * @dev Temporarily only support 0 as account Index for speed optimization.
   */
  async getPublicKey(
    transport: Transport, appPrivateKey: string, appId: string, keyIndex:number, deep:number ,isSLIP0010 = true
  ) : Promise<string> {
    const pathType = isSLIP0010 ? PathType.SLIP0010 : PathType.BIP32EDDSA;
    console.log("🚀 ~ file: EDDSA.ts ~ line 22 ~ EDDSACoin ~ pathType", pathType)
    const path = await utils.getPath(this.coinType, keyIndex, deep, pathType);
    console.log("🚀 ~ file: EDDSA.ts ~ line 23 ~ EDDSACoin ~ path", path)
    return getPublicKeyByPath(transport, appId, appPrivateKey, path);
  }
}
