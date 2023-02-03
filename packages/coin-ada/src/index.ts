/* eslint-disable no-param-reassign */
import { coin as COIN, Transport, utils, config, apdu, tx } from '@coolwallet/core';
import {
  accountKeyToAddress,
  genFakeTxBody,
  genTxBody,
  genFakeWitness,
  genWitness,
  getScript,
  getArguments,
} from './utils';

import { TxTypes } from './config/types';
export { TxTypes };

import type { Options, RawTransaction, Transaction } from './config/types';

export type { Options, RawTransaction, Transaction };

export default class ADA implements COIN.Coin {
  isTestNet = false;
  constructor(isTest = false) {
    this.isTestNet = isTest;
  }

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
    const address = accountKeyToAddress(accPubkeyBuff, addressIndex, this.isTestNet);
    return address;
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const accPubKey = await this.getAccountPubKey(transport, appPrivateKey, appId);
    const address = this.getAddressByAccountKey(accPubKey, addressIndex);
    return address;
  }

  getTransactionSize(transaction: RawTransaction, txType = TxTypes.Transfer): number {
    const internalTx = { ...transaction, fee: 170000 };
    const txHex =
      '83' + genFakeTxBody(internalTx, txType, this.isTestNet) + genFakeWitness(internalTx.addrIndexes, txType) + 'f6';
    return txHex.length / 2;
  }

  getTransferSize(transaction: RawTransaction) {
    return this.getTransactionSize(transaction, TxTypes.Transfer);
  }

  getStakeRegisterSize(transaction: RawTransaction) {
    return this.getTransactionSize(transaction, TxTypes.StakeRegister);
  }

  getStakeRegisterAndDelegateSize(transaction: RawTransaction) {
    return this.getTransactionSize(transaction, TxTypes.StakeRegisterAndDelegate);
  }

  getStakeDeregisterSize(transaction: RawTransaction) {
    return this.getTransactionSize(transaction, TxTypes.StakeDeregister);
  }

  getStakeDelegateSize(transaction: RawTransaction) {
    return this.getTransactionSize(transaction, TxTypes.StakeDelegate);
  }

  getStakeWithdrawSize(transaction: RawTransaction) {
    return this.getTransactionSize(transaction, TxTypes.StakeWithdraw);
  }

  async signTransaction(transaction: Transaction, options: Options, txType = TxTypes.Transfer): Promise<string> {
    const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = options;
    const internalTx = { ...transaction };

    // prepare data

    const script = getScript(txType);
    const accPubKey = await this.getAccountPubKey(transport, appPrivateKey, appId);
    const witnesses = getArguments(internalTx, accPubKey, txType, this.isTestNet);

    // request CoolWallet to sign tx

    for (const witness of witnesses) {
      await apdu.tx.sendScript(transport, script);
      const encryptedSig = await apdu.tx.executeScript(transport, appId, appPrivateKey, witness.arg);
      if (!encryptedSig) throw new Error('executeScript fails to return signature');
      witness.sig = encryptedSig;
    }

    if (typeof confirmCB === 'function') confirmCB();

    // show information for verification

    await apdu.tx.finishPrepare(transport);
    await apdu.tx.getTxDetail(transport);

    // resolve signature

    const decryptingKey = await apdu.tx.getSignatureKey(transport);
    if (typeof authorizedCB === 'function') {
      authorizedCB();
    }
    for (const witness of witnesses) {
      const encryptedSig = witness.sig;
      const sig = tx.util.decryptSignatureFromSE(encryptedSig, decryptingKey, true);
      witness.sig = sig.toString('hex');
    }
    await apdu.tx.clearTransaction(transport);
    await apdu.mcu.control.powerOff(transport);

    // construct the signed transaction

    const signedTx = '83' + genTxBody(internalTx, accPubKey, txType, this.isTestNet) + genWitness(witnesses) + 'f6';

    // const { signedTx: verifyTxBody } = await apdu.tx.getSignedHex(transport);
    return signedTx;
  }

  async signTransfer(transaction: Transaction, options: Options) {
    return this.signTransaction(transaction, options, TxTypes.Transfer);
  }

  async signStakeRegister(transaction: Transaction, options: Options) {
    return this.signTransaction(transaction, options, TxTypes.StakeRegister);
  }

  async signStakeRegisterAndDelegate(transaction: Transaction, options: Options) {
    return this.signTransaction(transaction, options, TxTypes.StakeRegisterAndDelegate);
  }

  async signStakeDeregister(transaction: Transaction, options: Options) {
    return this.signTransaction(transaction, options, TxTypes.StakeDeregister);
  }

  async signStakeDelegate(transaction: Transaction, options: Options) {
    return this.signTransaction(transaction, options, TxTypes.StakeDelegate);
  }

  async signStakeWithdraw(transaction: Transaction, options: Options) {
    return this.signTransaction(transaction, options, TxTypes.StakeWithdraw);
  }
}
