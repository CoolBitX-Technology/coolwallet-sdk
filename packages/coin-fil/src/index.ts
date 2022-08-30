import { coin as COIN, Transport, apdu, tx } from '@coolwallet/core';
import * as utils from './utils';
import * as params from './config/params';
import type { Options, InputTransaction, SignedTransaction } from './config/types';
export type { Options, InputTransaction, SignedTransaction };

export default class FIL extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return utils.pubKeyToAddress(publicKey);
  }

  getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): string {
    const publicKey = this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return utils.pubKeyToAddress(publicKey);
  }

  async signTransaction(transaction: InputTransaction, options: Options): Promise<SignedTransaction> {
    const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = options;
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, transaction.addressIndex);

    // prepare data

    const signScript = utils.getScript();
    const signArguments = await utils.getArguments(transaction, publicKey);

    // request CoolWallet to sign tx

    await apdu.tx.sendScript(transport, signScript);
    const encryptedSig = await apdu.tx.executeScript(transport, appId, appPrivateKey, signArguments);
    if (!encryptedSig) throw new Error('executeScript fails to return signature');

    // verification and return signed tx

    await apdu.tx.finishPrepare(transport);
    await apdu.tx.getTxDetail(transport);
    const decryptingKey = await apdu.tx.getSignatureKey(transport);
    await apdu.tx.clearTransaction(transport);
    await apdu.mcu.control.powerOff(transport);
    const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey);
    const signedTx = utils.getSignedTransaction(transaction, sig as { r: string; s: string }, publicKey);
    return signedTx;
  }
}
