import { getPublicKeyByPath, derivePubKey } from './derive';
import Transport from '../transport';
import * as utils from '../utils';
import { PathType } from '../config/param';

const EC = require('elliptic').ec;

export default class ECDSACoin {
  coinType: string;

  accExtendPublicKeyMap: Map<number, { publicKey: string; chainCode: string; indexPublicKeys: Map<number, string> }>;
  ec: any;

  constructor(coinType: string, curvePara?: string) {
    this.coinType = coinType;
    this.accExtendPublicKeyMap = new Map<
      number,
      { publicKey: string; chainCode: string; indexPublicKeys: Map<number, string> }
    >();
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
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number,
    purpose?: number
  ): Promise<string> => {
    if (!purpose) {
      purpose = 44;
    }
    const accExtendPublicKey = this.accExtendPublicKeyMap.get(purpose);
    if (!accExtendPublicKey) {
      const extAccKey = await this.getAccountPubKeyAndChainCode(transport, appPrivateKey, appId, purpose);
      const node = derivePubKey(extAccKey.accountPublicKey, extAccKey.accountChainCode, 0, addressIndex);
      const indexPublicKeys = new Map<number, string>();
      indexPublicKeys.set(addressIndex, node.publicKey);
      this.accExtendPublicKeyMap.set(purpose, {
        publicKey: extAccKey.accountPublicKey,
        chainCode: extAccKey.accountChainCode,
        indexPublicKeys,
      });
      return node.publicKey;
    } else {
      const indexPublicKey = accExtendPublicKey.indexPublicKeys.get(addressIndex);
      if (indexPublicKey) {
        return indexPublicKey;
      }
      const node = derivePubKey(accExtendPublicKey.publicKey, accExtendPublicKey.chainCode, 0, addressIndex);
      accExtendPublicKey.indexPublicKeys.set(addressIndex, node.publicKey);
      return node.publicKey;
    }
  };

  getAccountPubKeyAndChainCode = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    purpose?: number
  ): Promise<{ accountPublicKey: string; accountChainCode: string }> => {
    if (!purpose) {
      purpose = 44;
    }
    const accExtendPublicKey = this.accExtendPublicKeyMap.get(purpose);
    if (!accExtendPublicKey) {
      const path = await utils.getPath(this.coinType, 0, 3, PathType.BIP32, purpose);
      const decryptedData = await getPublicKeyByPath(transport, appId, appPrivateKey, path);
      const accBuf = Buffer.from(decryptedData, 'hex');
      const accPublicKey = Buffer.from(accBuf.subarray(0, 33)).toString('hex');
      const accChainCode = Buffer.from(accBuf.subarray(33)).toString('hex');
      return { accountPublicKey: accPublicKey, accountChainCode: accChainCode };
    } else {
      return { accountPublicKey: accExtendPublicKey.publicKey, accountChainCode: accExtendPublicKey.chainCode };
    }
  };

  getAddressPublicKey = (accPublicKey: string, accChainCode: string, addressIndex: number): string => {
    const node = derivePubKey(accPublicKey, accChainCode, 0, addressIndex);
    return node.publicKey;
  };

  /**
   * decompress public key
   */
  async getFullPubKey(compressPubKey: string): Promise<string> {
    const keyPair = this.ec.keyFromPublic(compressPubKey, 'hex');
    return keyPair.getPublic(false, 'hex');
  }
}
