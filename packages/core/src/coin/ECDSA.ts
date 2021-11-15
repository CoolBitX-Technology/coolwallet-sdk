import { getAccountExtKeyFromSE, derivePubKey } from './derive';
import Transport from '../transport';
import * as utils from '../utils';

const EC = require('elliptic').ec;

export default class ECDSACoin {
  coinType: string;

  accPublicKey: string;

  accChainCode: string;

  publicKeys: string[];

  ec: any;

  constructor(coinType: string, curvePara?: string) {
    this.coinType = coinType;
    this.accPublicKey = '';
    this.accChainCode = '';
    this.publicKeys = [];
    if (!curvePara) {
      this.ec = new EC('secp256k1');
    } else {
      this.ec = new EC(curvePara);
    }
    this.getPublicKey = this.getPublicKey.bind(this);
  }

  /**
   * For ECDSA based coins
   */
  getPublicKey = async (
    transport: Transport, appPrivateKey: string, appId: string, addressIndex: number
  ): Promise<string> => {
    if (this.accPublicKey === '' || this.accChainCode === '') {
      await this.getAccountPubKeyAndChainCode(transport, appPrivateKey, appId);
    }
    if (!this.publicKeys[addressIndex]) {
      const node = derivePubKey(this.accPublicKey, this.accChainCode, 0, addressIndex);
      this.publicKeys[addressIndex] = node.publicKey;
    }
    return this.publicKeys[addressIndex];
  }

  getAccountPubKeyAndChainCode = async (
    transport: Transport, appPrivateKey: string, appId: string
  ): Promise<{accountPublicKey:string, accountChainCode:string}> => {
    if (this.accPublicKey === '' || this.accChainCode === '') {
      const path = await utils.getAccountPath({ coinType: this.coinType });
      const decryptedData = await getAccountExtKeyFromSE(transport, appId, appPrivateKey, path);
      const accBuf = Buffer.from(decryptedData, 'hex');
      this.accPublicKey = accBuf.slice(0, 33).toString('hex');
      this.accChainCode = accBuf.slice(33).toString('hex');
    }
    return { accountPublicKey: this.accPublicKey, accountChainCode: this.accChainCode };
  }

  getAddressPublicKey = (
    accPublicKey: string, accChainCode: string, addressIndex: number
  ): string => {
    const node = derivePubKey(accPublicKey, accChainCode, 0, addressIndex);
    return node.publicKey;
  }

  /**
   * decompress public key
   */
  async getFullPubKey(compressPubKey: string): Promise<string> {
    const keyPair = this.ec.keyFromPublic(compressPubKey, 'hex');
    return keyPair.getPublic(false, 'hex');
  }
}
