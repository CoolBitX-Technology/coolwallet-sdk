/* eslint-disable no-param-reassign */
import { coin as COIN, Transport, utils, config, tx, mcu, CardType, error } from '@coolwallet/core';
import {
  accountKeyToAddress,
  genFakeTxBody,
  genTxBody,
  genFakeWitness,
  genWitness,
  getScript,
  getArguments,
  getMessageArgument,
  decodeAddress,
  cborEncode,
} from './utils';

import { MajorType, TxTypes } from './config/types';
export { TxTypes };

import type { MessageTransaction, Options, RawTransaction, Transaction } from './config/types';

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

    let txHex = genFakeTxBody(internalTx, txType, this.isTestNet) + genFakeWitness(internalTx.addrIndexes, txType);
    if (txType === TxTypes.Abstain) {
      txHex = '84' + txHex + 'f5f6';
    } else {
      txHex = '83' + txHex + 'f6';
    }

    return txHex.length / 2;
  }

  async signTransaction(transaction: Transaction, options: Options, txType = TxTypes.Transfer): Promise<string> {
    const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = options;
    const internalTx = { ...transaction };

    // prepare data
    const script = getScript(txType);
    const accPubKey = await this.getAccountPubKey(transport, appPrivateKey, appId);
    const witnesses = getArguments(internalTx, accPubKey, txType, this.isTestNet);

    // request CoolWallet to sign tx
    await tx.command.sendScript(transport, script);
    for (const witness of witnesses) {
      const encryptedSig = await tx.command.executeScript(transport, appId, appPrivateKey, witness.arg);
      if (!encryptedSig) throw new Error('executeScript fails to return signature');
      witness.sig = encryptedSig;
    }

    if (typeof confirmCB === 'function') confirmCB();

    if (transport.cardType === CardType.Pro) {
      // show information for verification
      await tx.command.finishPrepare(transport);
      await tx.command.getTxDetail(transport);

      // resolve signature
      const decryptingKey = await tx.command.getSignatureKey(transport);
      if (typeof authorizedCB === 'function') {
        authorizedCB();
      }
      for (const witness of witnesses) {
        const encryptedSig = witness.sig;
        const sig = tx.util.decryptSignatureFromSE(encryptedSig, decryptingKey, tx.SignatureType.EDDSA);
        witness.sig = sig.toString('hex');
      }
      await tx.command.clearTransaction(transport);
      await mcu.control.powerOff(transport);
    } else if (transport.cardType === CardType.Go) {
      for (const witness of witnesses) {
        const encryptedSig = witness.sig;
        const sig = tx.util.formatSignature(encryptedSig, tx.SignatureType.EDDSA);
        witness.sig = sig.toString('hex');
      }
    } else {
      throw new error.SDKError(ADA.prototype.signTransaction.name, 'Not suppotrd card type.');
    }

    // construct the signed transaction

    if (txType === TxTypes.Abstain) {
      return '84' + genTxBody(internalTx, accPubKey, txType, this.isTestNet) + genWitness(witnesses) + 'f5f6';
    } else {
      return '83' + genTxBody(internalTx, accPubKey, txType, this.isTestNet) + genWitness(witnesses) + 'f6';
    }

    // const { signedTx: verifyTxBody } = await apdu.tx.getSignedHex(transport);
    // return signedTx;
  }

  async signMessage(transaction: MessageTransaction, options: Options): Promise<string> {
    const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = options;
    const internalTx = { ...transaction };

    // prepare data
    const script = getScript(TxTypes.Message);
    const accPubKey = await this.getAccountPubKey(transport, appPrivateKey, appId);
    const argument = getMessageArgument(internalTx, accPubKey, this.isTestNet);

    // request CoolWallet to sign tx
    await tx.command.sendScript(transport, script);

    const encryptedSig = await tx.command.executeScript(transport, appId, appPrivateKey, argument);
    if (!encryptedSig) throw new Error('executeScript fails to return signature');

    if (typeof confirmCB === 'function') confirmCB();
    let sig = '';
    if (transport.cardType === CardType.Pro) {
      // show information for verification
      await tx.command.finishPrepare(transport);
      await tx.command.getTxDetail(transport);

      // resolve signature
      const decryptingKey = await tx.command.getSignatureKey(transport);
      if (typeof authorizedCB === 'function') {
        authorizedCB();
      }
      sig = tx.util.decryptSignatureFromSE(encryptedSig, decryptingKey, tx.SignatureType.EDDSA).toString('hex');

      await tx.command.clearTransaction(transport);
      await mcu.control.powerOff(transport);
    } else if (transport.cardType === CardType.Go) {
      sig = tx.util.formatSignature(encryptedSig, tx.SignatureType.EDDSA).toString('hex');
    } else {
      throw new error.SDKError(ADA.prototype.signTransaction.name, 'Not suppotrd card type.');
    }

    // construct the signed transaction
    const { receiveAddress, message } = transaction;
    const { addressBuff } = decodeAddress(receiveAddress, this.isTestNet);
    const messageBuff = Buffer.from(message, 'ascii');

    const protectedHeaders =
      'a2' + '0127' + '6761646472657373' + cborEncode(MajorType.Byte, addressBuff.length) + addressBuff.toString('hex');
    const unprotectedHeaders = '686173686564' + 'f4';
    const payload = messageBuff.toString('hex');
    return (
      '84' +
      +cborEncode(MajorType.Byte, protectedHeaders) +
      protectedHeaders +
      cborEncode(MajorType.Map, 1) +
      unprotectedHeaders +
      cborEncode(MajorType.Byte, payload.length) +
      payload +
      cborEncode(MajorType.Byte, Buffer.from(sig, 'hex').length) +
      sig
    );
  }
}
