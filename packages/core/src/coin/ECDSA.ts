import * as derivation from './derive';
import Transport from "../transport";

export default class ECDSACoin {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  coinType: string;
  accPublicKey: string;
  accChainCode: string;
  publicKeys: any;
  constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string) {
    this.transport = transport;
    this.appPrivateKey = appPrivateKey;
    this.appId = appId;
    this.coinType = coinType;
    this.accPublicKey = '';
    this.accChainCode = '';
    this.publicKeys = {};

    this.getPublicKey = this.getPublicKey.bind(this);
  }

  /**
   * For ECDSA based coins
   * @param {Number} addressIndex address index in BIP44 pointing to the target public key.
   * @returns {Promise < string >}
   */
  async getPublicKey(addressIndex: number) {
    if (this.accPublicKey === '' || this.accChainCode === '') {
      const { accountPublicKey, accountChainCode } = await derivation.getAccountExtKey(
        this.transport,
        this.appId,
        this.appPrivateKey,
        this.coinType,
        0
      );
      this.accPublicKey = accountPublicKey;
      this.accChainCode = accountChainCode;
    }
    if (!this.publicKeys[addressIndex]) {
      const node = derivation.derivePubKey(this.accPublicKey, this.accChainCode, 0, addressIndex);
      this.publicKeys[addressIndex] = node.publicKey;
    }
    return this.publicKeys[addressIndex];
  }

  /**
   * For ECDSA based coins
   * @returns {Promise < { publicKey: string, parentPublicKey: string, parentChainCode: string } >}
   */
  async getBIP32NodeInfo() {
    const { accountPublicKey, accountChainCode } = await derivation.getAccountExtKey(
      this.transport,
      this.appId,
      this.appPrivateKey,
      this.coinType,
      0
    );
    const { parentPublicKey, parentChainCode } = derivation.derivePubKey(
      accountPublicKey,
      accountChainCode,
      0
    );
    return { parentPublicKey, parentChainCode };
  }
}
