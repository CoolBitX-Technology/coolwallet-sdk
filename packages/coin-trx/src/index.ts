import { coin as COIN } from '@coolwallet/core';
import * as trxSign from './sign';
import * as scriptUtil from './utils/scriptUtil';
import * as txUtil from './utils/transactionUtil';
import * as params from './config/params';
import * as type from './config/types';

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
    const script = params.TRC20.script + params.TRC20.signature;
    const argument = await scriptUtil.getTRC20Argument(transaction, addressIndex);

    return trxSign.signTransaction(signTxData, script, argument, publicKey);
  }
}
