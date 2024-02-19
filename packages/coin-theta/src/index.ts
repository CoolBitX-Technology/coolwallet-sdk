/* eslint-disable no-param-reassign */
import { coin as COIN, Transport, apdu, tx } from '@coolwallet/core';
import BigNumber from 'bignumber.js';
import * as utils from './utils';
import * as params from './config/params';
import { TxTypes } from './config/types';
import type {
  Options,
  Transaction,
  SendTransaction,
  StakeValidatorTransaction,
  StakeGuardianTransaction,
  StakeEdgeTransaction,
  WithdrawTransaction,
  SmartTransaction,
} from './config/types';
export type {
  Options,
  SendTransaction,
  StakeValidatorTransaction,
  StakeGuardianTransaction,
  StakeEdgeTransaction,
  WithdrawTransaction,
  SmartTransaction,
};

export default class Theta extends COIN.ECDSACoin implements COIN.Coin {
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

  async signTransactionBase(transaction: Transaction, options: Options, txType: TxTypes): Promise<string> {
    const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = options;
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, transaction.addressIndex);
    const fromAddr = utils.pubKeyToAddress(publicKey);

    // prepare data

    const signScript = utils.getScript(txType).scriptWithSignature;
    const signArguments = await utils.getArguments(transaction, fromAddr, txType);

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
    const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, tx.SignatureType.Canonical);
    const signedTx = utils.getSignedTransaction(transaction, sig as { r: string; s: string }, publicKey, txType);
    return signedTx;
  }

  async signTransaction(transaction: SendTransaction, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.Send);
  }

  async signStakeValidatorTransaction(transaction: StakeValidatorTransaction, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.StakeValidator);
  }

  async signStakeGuardianTransaction(transaction: StakeGuardianTransaction, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.StakeGuardian);
  }

  async signStakeEdgeTransaction(transaction: StakeEdgeTransaction, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.StakeEdge);
  }

  async signWithdrawTransaction(transaction: WithdrawTransaction, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.Withdraw);
  }

  async signSmartTransaction(transaction: SmartTransaction, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.Smart);
  }

  async signEvmTransaction(transaction: SmartTransaction, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.Evm);
  }
}
