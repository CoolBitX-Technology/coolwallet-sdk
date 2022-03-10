import { coin as COIN, Transport, utils, config, apdu, tx } from '@coolwallet/core';

const bip32 = require('bip32');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const createKeccakHash = require('keccak');
const rlp = require('rlp');

import { Transaction, handleHex, getRawTx } from './utils';

export default class ETC implements COIN.Coin {
  getPublicKey = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> => {
    const { accPublicKey, accChainCode } = await this.getAccountPubKeyAndChainCode(transport, appId, appPrivateKey);
    return this.getPublicKeyByAccountKey(accPublicKey, accChainCode, addressIndex);
  };

  getAccountPubKeyAndChainCode = async (
    transport: Transport,
    appId: string,
    appPrivateKey: string
  ): Promise<{ accPublicKey: string; accChainCode: string }> => {
    // *** 1. Define Full Path: 44'/61'/0' as the path for Ethereum Classic
    const path = utils.getFullPath({
      pathType: config.PathType.BIP32,
      pathString: "44'/61'/0'",
    });
    // *** 2. Get Public Key by Full Path ***
    const accExtKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
    const accExtKeyBuf = Buffer.from(accExtKey, 'hex');
    const accPublicKey = accExtKeyBuf.slice(0, 33).toString('hex');
    const accChainCode = accExtKeyBuf.slice(33).toString('hex');
    return { accPublicKey, accChainCode };
  };

  getPublicKeyByAccountKey = (accPublicKey: string, accChainCode: string, addressIndex: number): string => {
    const accNode = bip32.fromPublicKey(Buffer.from(accPublicKey, 'hex'), Buffer.from(accChainCode, 'hex'));
    const changeNode = accNode.derive(0);
    const addressNode = changeNode.derive(addressIndex);
    const publicKey = addressNode.publicKey.toString('hex');
    return publicKey;
  };

  publicKeyToAddress = (publicKey: string) => {
    const uncompressedKey = ec.keyFromPublic(publicKey, 'hex').getPublic(false, 'hex');
    const keyBuffer = Buffer.from(uncompressedKey.substr(2), 'hex');
    const keyHash = createKeccakHash('keccak256').update(keyBuffer).digest('hex');
    const address = '0x'.concat(keyHash.substr(-40));
    return address;
  };

  getAddress = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> => {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return this.publicKeyToAddress(publicKey);
  };

  getAddressByAccountKey = async (
    accPublicKey: string,
    accChainCode: string,
    addressIndex: number
  ): Promise<string> => {
    const publicKey = await this.getPublicKeyByAccountKey(accPublicKey, accChainCode, addressIndex);
    return this.publicKeyToAddress(publicKey);
  };

  signTransaction = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number,
    transaction: Transaction
  ): Promise<string> => {
    const script =
      `03040601C707000000003DA00700C2ACD70032FFF8C2ACD7001EFFF6C2ACD70028FFF6CC071094CAA02700C2A2D700FFF6CC071080CC0E103DC2E09700CC07C0028080BE0710DC07C003455443CC0FC0023078BAA02F6C0E04DDF09700DAA2D7C0FFF612D207CC05065052455353425554546F4E`;
    return this.doTransaction(transport, appPrivateKey, appId, addressIndex, transaction, script);
  };

  doTransaction = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number,
    transaction: Transaction,
    script: string
  ): Promise<string> => {
    // *** 1. send script with signature

    const scriptSig =
      `3045022100C75C82DBAD0B2FEF75E40828F281F49A963E420221D4A7CF95575ED265DC010502202CE1484B54E51AAFF93368583C9CD3474DEE423355C1BFAD025BF6907458CB7B`.padStart(
        144,
        '0'
      );

    await apdu.tx.sendScript(transport, script + scriptSig);

    // 2. Form arguments

    const path = await utils.getFullPath({
      pathType: config.PathType.BIP32,
      pathString: "44'/61'/0'/0/0",
    });

    const argument =
      '15' +
      path +
      handleHex(transaction.to) +
      handleHex(transaction.value).padStart(20, '0') +
      handleHex(transaction.gasPrice).padStart(20, '0') +
      handleHex(transaction.gasLimit).padStart(20, '0') +
      handleHex(transaction.nonce).padStart(16, '0') +
      handleHex(transaction.data);

    // 3. Validation and The Encrypted Signature ***

    const encryptedSig = await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

    if (typeof transaction.confirmCB === "function") {
      transaction.confirmCB();
    }
    await apdu.tx.finishPrepare(transport);
    await apdu.tx.getTxDetail(transport);
    const decryptingKey = await apdu.tx.getSignatureKey(transport);
    if (typeof transaction.authorizedCB === "function") {
      transaction.authorizedCB();
    }
    await apdu.tx.clearTransaction(transport);
    await apdu.mcu.control.powerOff(transport);
    const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey);

    // 4. construct the signed transaction and return the result

    const { signedTx } = await apdu.tx.getSignedHex(transport);
    const rawTx = getRawTx(transaction);
    const rawData = rlp.encode(rawTx);
    if (rawData.toString('hex') !== signedTx) {
      throw new Error('unexpected transaction format!');
    }

    const hash = createKeccakHash('keccak256').update(rawData).digest('hex');
    const data = Buffer.from(handleHex(hash), 'hex');

    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const keyPair = ec.keyFromPublic(publicKey, 'hex');

    const recoveryParam = ec.getKeyRecoveryParam(data, sig, keyPair.pub);
    const v = recoveryParam + 27;
    const { r, s } = sig as { r: string; s: string };

    const vValue = v + 61 * 2 + 8;
    const signedTransaction = rawTx.slice(0, 6);
    const vBuf = Buffer.allocUnsafe(6);
    vBuf.writeIntBE(vValue, 0, 6);
    signedTransaction.push(Buffer.from(vBuf.filter((e) => e !== 0)), Buffer.from(r, 'hex'), Buffer.from(s, 'hex'));
    const serializedTx = rlp.encode(signedTransaction);
    return `0x${serializedTx.toString('hex')}`;
  };
}
