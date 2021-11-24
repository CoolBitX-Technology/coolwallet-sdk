import crypto from 'crypto';
import {
  coin as COIN, transport as Transport, utils, config
} from '@coolwallet/core';

const bip32 = require('bip32');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const createKeccakHash = require('keccak')

export default class ADA implements COIN.Coin {
  getAddress = async (
    transport: Transport.default,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> => {
    const path = await utils.getFullPath({
      pathType: config.PathType.BIP32ED25519,
      pathString: "44'/60'/0'",
    });
    const accExtKey = await COIN.getAccountExtKeyFromSE(transport, appId, appPrivateKey, path);
    const accExtKeyBuf = Buffer.from(accExtKey, 'hex');
    const accPublicKey = accExtKeyBuf.slice(0, 33);
    const accChainCode = accExtKeyBuf.slice(33);

    const accNode = bip32.fromPublicKey(accPublicKey, accChainCode);
    const changeNode = accNode.derive(0);
    const addressNode = changeNode.derive(0);
    const publicKey = addressNode.publicKey.toString('hex');

    const uncompressedKey = ec.keyFromPublic(publicKey, "hex").getPublic(false);
    const keyHash = createKeccakHash('keccak256').update(uncompressedKey).digest('hex');
    const address = "0x".concat(keyHash.substr(-40));
    return address;
  }

  signTransaction = async (
  ): Promise<string> => {

    const signedTransaction = '';

    return signedTransaction;
  };
}
