import { coin as COIN, error, mcu, tx } from '@coolwallet/core';
import * as trxSign from './sign';
import * as scriptUtil from './utils/scriptUtil';
import * as txUtil from './utils/transactionUtil';
import * as params from './config/params';
import * as type from './config/types';
import BigNumber from 'bignumber.js';
import { command } from '@coolwallet/core/lib/transaction';
import { decryptSignatureFromSE } from '@coolwallet/core/lib/transaction/util';
import { sha256 } from './utils/cryptoUtil';

const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ec = new elliptic.ec('secp256k1');

export { RESOURCE_CODE } from './config/params';
export default class TRX extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  /**
   * Get Tron address by index
   */
  async getAddress(
    transport: type.Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.pubKeyToAddress(publicKey);
  }

  async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return txUtil.pubKeyToAddress(publicKey);
  }

  /**
   * Sign Tron Transaction.
   */
  async signTransaction(signTxData: type.NormalTradeData): Promise<string> {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;
    const script = params.TRANSFER.script + params.TRANSFER.signature;
    const argument = await scriptUtil.getNormalTradeArgument(transaction, addressIndex);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    return trxSign.signTransaction(signTxData, script, argument, publicKey);
  }

  /**
   * @deprecated The method should not use anymore
   */
  async signFreeze(signTxData: type.FreezeData): Promise<string> {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;
    const { receiverAddress, ownerAddress } = transaction.contract;

    let script;
    let argument;
    if (!!receiverAddress && receiverAddress !== ownerAddress) {
      script = params.FREEZE.script + params.FREEZE.signature;
      argument = await scriptUtil.getFreezeArgument(transaction, addressIndex, true);
    } else {
      script = params.FREEZE_NO_RECEIVER.script + params.FREEZE_NO_RECEIVER.signature;
      argument = await scriptUtil.getFreezeArgument(transaction, addressIndex, false);
    }
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    return trxSign.signTransaction(signTxData, script, argument, publicKey);
  }

  async signUnfreeze(signTxData: type.UnfreezeData): Promise<string> {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;
    const { receiverAddress, ownerAddress } = transaction.contract;

    let script;
    let argument;
    if (!!receiverAddress && receiverAddress !== ownerAddress) {
      script = params.UNFREEZE.script + params.UNFREEZE.signature;
      argument = await scriptUtil.getUnfreezeArgument(transaction, addressIndex, true);
    } else {
      script = params.UNFREEZE_NO_RECEIVER.script + params.UNFREEZE_NO_RECEIVER.signature;
      argument = await scriptUtil.getUnfreezeArgument(transaction, addressIndex, false);
    }
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    return trxSign.signTransaction(signTxData, script, argument, publicKey);
  }

  async signVoteWitness(signTxData: type.VoteWitnessData): Promise<string> {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;

    const script = params.VOTE.script + params.VOTE.signature;
    const argument = await scriptUtil.getVoteWitnessArgument(transaction, addressIndex);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    return trxSign.signTransaction(signTxData, script, argument, publicKey);
  }

  async signWithdrawBalance(signTxData: type.WithdrawBalanceData): Promise<string> {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;

    const script = params.WITHDRAW.script + params.WITHDRAW.signature;
    const argument = await scriptUtil.getWithdrawBalanceArgument(transaction, addressIndex);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    return trxSign.signTransaction(signTxData, script, argument, publicKey);
  }

  async signTRC20Transfer(signTxData: type.TRC20TransferData): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, transaction } = signTxData;

    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const tokenAmount = transaction.contract.amount;
    const decimals = transaction.option.info.decimals;
    const humanAmount = new BigNumber(tokenAmount).shiftedBy(-decimals);
    const humanAmountLimit = new BigNumber(1).shiftedBy(8); // 100_000_000

    let script = params.TRC20.script + params.TRC20.signature;
    if (humanAmount.gte(humanAmountLimit)) {
      script = params.TRC20_BLIND.script + params.TRC20_BLIND.signature;
    }

    const argument = await scriptUtil.getTRC20Argument(transaction, addressIndex);
    return trxSign.signTransaction(signTxData, script, argument, publicKey);
  }

  async signFreezeV2(signTxData: type.FreezeDataV2): Promise<string> {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;

    const script = params.FREEZE_V2.script + params.FREEZE_V2.signature;
    const argument = await scriptUtil.getFreezeV2Argument(transaction, addressIndex);

    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    return trxSign.signTransaction(signTxData, script, argument, publicKey);
  }

  async signUnfreezeV2(signTxData: type.UnfreezeDataV2): Promise<string> {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;

    const script = params.UNFREEZE_V2.script + params.UNFREEZE_V2.signature;
    const argument = await scriptUtil.getUnfreezeV2Argument(transaction, addressIndex);

    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    return trxSign.signTransaction(signTxData, script, argument, publicKey);
  }

  async signWithdrawExpireUnfreeze(signTxData: type.WithdrawExpireUnfreezeData): Promise<string> {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;

    const script = params.WITHDRAW_EXPIRE_UNFREEZE.script + params.WITHDRAW_EXPIRE_UNFREEZE.signature;
    const argument = await scriptUtil.getWithdrawExpireUnfreezeArgument(transaction, addressIndex);

    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    return trxSign.signTransaction(signTxData, script, argument, publicKey);
  }

  async signCancelAllUnfreezeV2(signTxData: type.CancelAllUnfreezeDataV2): Promise<string> {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;

    const script = params.CANCEL_ALL_UNFREEZE_V2.script + params.CANCEL_ALL_UNFREEZE_V2.signature;
    const argument = await scriptUtil.getCancelAllUnfreezeV2Argument(transaction, addressIndex);

    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    return trxSign.signTransaction(signTxData, script, argument, publicKey);
  }

  async signTwoTransfers(signTxData: type.TwoTransferData): Promise<string[]> {
    const { transport, transaction1, transaction2, appPrivateKey, appId, addressIndex, confirmCB, authorizedCB } =
      signTxData;

    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    // set script
    const script = params.TWO_TRANSFERS.script + params.TWO_TRANSFERS.signature;
    await tx.command.sendScript(transport, script);

    // send argument1
    const argument1 = await scriptUtil.getTwoTransfersArgument(transaction1, addressIndex);
    const encryptedSignature1 = await tx.command.executeScript(transport, appId, appPrivateKey, argument1);
    const { signedTx: signedTx1 } = await tx.command.getSignedHex(transport);

    // send argument2
    const argument2 = await scriptUtil.getTwoTransfersArgument(transaction2, addressIndex);
    const encryptedSignature2 = await tx.command.executeScript(transport, appId, appPrivateKey, argument2);
    const { signedTx: signedTx2 } = await tx.command.getSignedHex(transport);

    confirmCB?.();

    await command.finishPrepare(transport);

    await command.getTxDetail(transport);

    const signatureKey = await command.getSignatureKey(transport);
    authorizedCB?.();

    await command.clearTransaction(transport);
    await mcu.control.powerOff(transport);

    if (!encryptedSignature1) throw new error.SDKError(this.signTwoTransfers.name, 'Encrypted signature1 is empty');
    if (!encryptedSignature2) throw new error.SDKError(this.signTwoTransfers.name, 'Encrypted signature2 is empty');

    const signature1 = decryptSignatureFromSE(encryptedSignature1, signatureKey, tx.SignatureType.Canonical);
    const signature2 = decryptSignatureFromSE(encryptedSignature2, signatureKey, tx.SignatureType.Canonical);

    if ('r' in signature1 === false || 's' in signature1 === false) {
      throw new error.SDKError(this.signTwoTransfers.name, 'Invalid signature1 format');
    }
    if ('r' in signature2 === false || 's' in signature2 === false) {
      throw new error.SDKError(this.signTwoTransfers.name, 'Invalid signature2 format');
    }

    const result1 = await TRX.toHex(signedTx1, publicKey, signature1);
    const result2 = await TRX.toHex(signedTx2, publicKey, signature2);
    return [result1, result2];
  }

  private static async toHex(
    signedTx: string,
    publicKey: string,
    canonicalSignature: { r: string; s: string }
  ): Promise<string> {
    const { r, s } = canonicalSignature;
    const keyPair = ec.keyFromPublic(publicKey, 'hex');
    const v = ec.getKeyRecoveryParam(sha256(Buffer.from(signedTx, 'hex')), canonicalSignature, keyPair.pub);

    const sig = r + s + v.toString().padStart(2, '0');

    return '0a' + toVarint(signedTx.length / 2) + signedTx + '12' + toVarint(sig.length / 2) + sig;
  }

  static getAddressFromAddressPublicKey(addressPublicKey: string): string {
    return txUtil.pubKeyToAddress(addressPublicKey);
  }
}

/**
 * @description convert int to varint
 * @param {number} int
 * @return {string}
 */
function toVarint(int: number) {
  const bytes = [];
  while (int > 0) {
    let out = int & 127;
    int = int >> 7;
    if (int > 0) out += 128;
    bytes.push([out]);
  }
  return Buffer.from(bytes).toString('hex');
}
