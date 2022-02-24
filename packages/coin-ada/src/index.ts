/* eslint-disable no-param-reassign */
import { coin as COIN, Transport, utils, config, apdu, tx } from '@coolwallet/core';
import {
  accountKeyToAddress,
  genTransferTxBody,
  genFakeWitness,
  genWitness,
  getTransferArgument,
} from './utils';
import * as params from './config/params';

import type { Options, TransferWithoutFee, Transfer } from './config/types';
export type { Options, TransferWithoutFee, Transfer };

export default class ADA implements COIN.Coin {

  // implement this because of not extending ECDSACoin
  async getAccountPubKey(transport: Transport, appPrivateKey: string, appId: string): Promise<string> {
    const pathType = config.PathType.BIP32ED25519;
    const pathString = "1852'/1815'/0'";
    const path = utils.getFullPath({ pathType, pathString });
    const pubkey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
    return pubkey;
  }

  getAddressByAccountKey(accPubkey: string, addressIndex: number): string {
    const accPubkeyBuff = Buffer.from(accPubkey, 'hex');
    const address = accountKeyToAddress(accPubkeyBuff, addressIndex);
    return address;
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const accPubkey = await this.getAccountPubKey(transport, appPrivateKey, appId);
    const address = this.getAddressByAccountKey(accPubkey, addressIndex);
    return address;
  }

  getTransactionSize(transaction: TransferWithoutFee): number {
    const { addrIndexes } = transaction;
    let estimatedTx = '83'
      + genTransferTxBody(transaction)
      + genFakeWitness(addrIndexes)
      + 'f6';
    return estimatedTx.length / 2;
  }

  async signTransaction(
    transaction: Transfer,
    options: Options
  ): Promise<string> {
    const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = options;
    const { inputs, output, change, fee, ttl } = transaction;

    // prepare data

    const script = params.TRANSFER.script + params.TRANSFER.signature;
    const accPubkey = await this.getAccountPubKey(transport, appPrivateKey, appId);
    const witnesses = await getTransferArgument(transaction, accPubkey);

    // request CoolWallet to sign tx

    for (let witness of witnesses) {
      await apdu.tx.sendScript(transport, script);
      const encryptedSig = await apdu.tx.executeScript(transport, appId, appPrivateKey, witness.arg);
      if (!encryptedSig) throw new Error('executeScript fails to return signature');
      witness.sig = encryptedSig;
    }

    // show information for verification

    await apdu.tx.finishPrepare(transport);
    await apdu.tx.getTxDetail(transport);

    // resolve signature

    const decryptingKey = await apdu.tx.getSignatureKey(transport);
    for (let witness of witnesses) {
      const encryptedSig = witness.sig;
      const sig = tx.util.decryptSignatureFromSE(encryptedSig, decryptingKey, true);
      witness.sig = sig.toString('hex');
    }
    await apdu.tx.clearTransaction(transport);
    await apdu.mcu.control.powerOff(transport);

    // construct the signed transaction

    const signedTx = '83'
      + genTransferTxBody(transaction)
      + genWitness(witnesses)
      + 'f6';

    // const { signedTx: verifyTxBody } = await apdu.tx.getSignedHex(transport);
    return signedTx;
  }
}
