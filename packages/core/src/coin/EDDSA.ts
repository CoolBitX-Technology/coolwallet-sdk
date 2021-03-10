import * as derivation from './derive';
import Transport from "../transport";
import * as utils from "../utils/index";

export default class EDDSACoin {

  coinType: string;
  constructor(coinType: string) {
    this.coinType = coinType;

    this.getPublicKey = this.getPublicKey.bind(this);
  }

  /**
   * For EdDSA based coins
   * @dev Temporarily only support 0 as account Index for speed optimization.
   * If you pass in accountIndex > 0, it will return the same publicKey.
   * @param {Number} accountIndex account index in BIP32 pointing to the target public key.
   * @param {string} protocol
   * @returns {Promise<string>}
   */
  async getPublicKey(transport: Transport, appPrivateKey: string, appId: string, isSLIP0010: boolean = true) {
    
    const path = await utils.getPath(this.coinType, 0, 3, !isBIP32)
  
    return derivation.getEd25519PublicKey(
      transport,
      appId,
      appPrivateKey,
      path
    );
  }
}
