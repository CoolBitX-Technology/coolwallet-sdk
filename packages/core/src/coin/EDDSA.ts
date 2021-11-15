import { getAccountExtKeyFromSE } from './derive';
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
    transport: Transport, appPrivateKey: string, appId: string, isSLIP0010 = true
  ) : Promise<string> {
    const path = await utils.getAccountPath({
      pathType: isSLIP0010 ? PathType.SLIP0010 : PathType.BIP32EDDSA,
      coinType: this.coinType,
    });
    return getAccountExtKeyFromSE(transport, appId, appPrivateKey, path);
  }
}
