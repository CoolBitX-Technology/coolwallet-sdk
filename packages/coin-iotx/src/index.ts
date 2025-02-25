import { coin as COIN, Transport, tx, mcu } from '@coolwallet/core';
import * as utils from './utils';
import * as params from './config/params';
import { TxTypes } from './config/types';
import type {
  Options,
  Transaction,
  Transfer,
  XRC20Token,
  Execution,
  StakeCreate,
  StakeUnstake,
  StakeWithdraw,
  StakeDeposit,
} from './config/types';
export type { Options, Transaction, Transfer, Execution, StakeCreate, StakeUnstake, StakeWithdraw };

export default class IOTX extends COIN.ECDSACoin implements COIN.Coin {
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

    // prepare data

    const signScript = utils.getScript(txType);
    const signArguments = await utils.getArguments(transaction, txType);
    console.log('signArguments :', signArguments);

    // request CoolWallet to sign tx

    await tx.command.sendScript(transport, signScript);
    const encryptedSig = await tx.command.executeScript(transport, appId, appPrivateKey, signArguments);
    if (!encryptedSig) throw new Error('executeScript fails to return signature');

    // const { signedTx } = await apdu.tx.getSignedHex(transport);
    // console.log('signedTx :', signedTx);

    // verification and return signed tx

    await tx.command.finishPrepare(transport);
    await tx.command.getTxDetail(transport);
    const decryptingKey = await tx.command.getSignatureKey(transport);
    await tx.command.clearTransaction(transport);
    await mcu.control.powerOff(transport);
    const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, tx.SignatureType.Canonical);
    const signedTx = utils.getSignedTransaction(transaction, sig as { r: string; s: string }, publicKey, txType);
    return signedTx;
  }

  async signTransaction(transaction: Transfer, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.Transfer);
  }

  async signXRC20Token(transaction: XRC20Token, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.XRC20Token);
  }

  async signExecution(transaction: Execution, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.Execution);
  }

  async signStakeCreate(transaction: StakeCreate, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.StakeCreate);
  }

  async signStakeUnstake(transaction: StakeUnstake, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.StakeUnstake);
  }

  async signStakeWithdraw(transaction: StakeWithdraw, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.StakeWithdraw);
  }

  async signStakeDeposit(transaction: StakeDeposit, options: Options): Promise<string> {
    return this.signTransactionBase(transaction, options, TxTypes.StakeDeposit);
  }
}
