import { Transport, coin as COIN } from '@coolwallet/core';
import { SDKError } from '@coolwallet/core/lib/error';
import { ChainProps } from './chain/base';
import { signTransaction } from './sign';
import { MsgDelegate, MsgSend, MsgUndelegate, MsgWithdrawDelegatorReward, ThorMsgSend } from './proto/msg';
import { publicKeyToAddress } from './utils/address';
import * as ARGS from './utils/arguments';
import { getProtoCoin } from './utils/coin';
import { TxType } from './constants';
import { THOR } from './chain';
import type { signMsg, signMsgDelegate, signMsgSend, signMsgUndelegate, signMsgWithdrawDelegatorReward } from './types';

class Cosmos extends COIN.ECDSACoin implements COIN.Coin {
  constructor(private readonly chain: ChainProps) {
    super(chain.getCoinType());
  }

  /**
   * Get Cosmos SDK compatible chain address by index.
   *
   * @param {Transport} transport CoolWallet SDK mandatory field
   * @param {string} appPrivateKey CoolWallet SDK mandatory field
   * @param {string} appId CoolWallet SDK mandatory field
   * @param {string} addressIndex Address index which is specified by bip44
   * @returns {Promise<string>}
   */
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    console.debug('publicKey: ' + Buffer.from(publicKey, 'hex').toString('base64'));
    return publicKeyToAddress(publicKey, this.chain.getPrefix());
  }

  /**
   * Sign MsgSend transaction.
   *
   * @param {signMsgSend} params
   * @returns {Promise<string>}
   */
  async signMsgSendTransaction(params: signMsgSend): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, transaction } = params;
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    const script = this.chain.getScripts().TRANSFER.scriptWithSignature;
    const argument = await ARGS.getMsgSendArgument(params, this.chain, publicKey);
    const coin = getProtoCoin(this.chain, transaction.coin.denom, transaction.coin.amount);
    const msgSend = new MsgSend(transaction.fromAddress, transaction.toAddress, [coin]);
    /// If chain is ThorChain, we should change typeUrl to /types.MsgSend
    /// Reference: https://dev.thorchain.org/thorchain-dev/how-tos/mainnet-rune-upgrade
    if (this.chain.isChainId(THOR.getChainId())) {
      const thorMsgSend = new ThorMsgSend(transaction.fromAddress, transaction.toAddress, [coin]);
      return signTransaction(params, this.chain, [thorMsgSend], publicKey, script, argument);
    }
    return signTransaction(params, this.chain, [msgSend], publicKey, script, argument);
  }

  /**
   * Sign MsgDelegate transaction.
   *
   * @param {signMsgDelegate} params
   * @returns {Promise<string>}
   */
  async signMsgDelegateTransaction(params: signMsgDelegate): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, transaction } = params;
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    const script = this.chain.getScripts().DELEGATE.scriptWithSignature;
    const argument = await ARGS.getMsgDelegateArgument(params, this.chain, publicKey);
    const coin = getProtoCoin(this.chain, transaction.coin.denom, transaction.coin.amount);
    const msgSend = new MsgDelegate(transaction.delegatorAddress, transaction.validatorAddress, coin);
    return signTransaction(params, this.chain, [msgSend], publicKey, script, argument);
  }

  /**
   * Sign MsgUndelegate transaction.
   *
   * @param {signMsgUndelegate} params
   * @returns {Promise<string>}
   */
  async signMsgUndelegateTransaction(params: signMsgUndelegate): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, transaction } = params;
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    const script = this.chain.getScripts().UNDELEGATE.scriptWithSignature;
    const argument = await ARGS.getMsgUndelegateArgument(params, this.chain, publicKey);
    const coin = getProtoCoin(this.chain, transaction.coin.denom, transaction.coin.amount);
    const msgSend = new MsgUndelegate(transaction.delegatorAddress, transaction.validatorAddress, coin);
    return signTransaction(params, this.chain, [msgSend], publicKey, script, argument);
  }

  /**
   * Sign MsgWithdrawDelegatorReward transaction.
   *
   * @param {signMsgWithdrawDelegatorReward} params
   * @returns {Promise<string>}
   */
  async signMsgWithdrawDelegatorRewardTransaction(params: signMsgWithdrawDelegatorReward): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, transaction } = params;
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    const script = this.chain.getScripts().WITHDRAW.scriptWithSignature;
    const argument = await ARGS.getMsgWithdrawDelegatorRewardArgument(params, this.chain, publicKey);
    const msgSend = new MsgWithdrawDelegatorReward(transaction.delegatorAddress, transaction.validatorAddress);
    return signTransaction(params, this.chain, [msgSend], publicKey, script, argument);
  }

  /**
   * Sign transaction with given TxType.
   *
   * @param {signMsg} params
   * @returns {Promise<string>}
   */
  async signTransaction(params: signMsg): Promise<string> {
    switch (params.type) {
      case TxType.MsgSend:
        return this.signMsgSendTransaction(params as signMsgSend);
      case TxType.MsgDelegate:
        return this.signMsgDelegateTransaction(params as signMsgDelegate);
      case TxType.MsgUndelegate:
        return this.signMsgUndelegateTransaction(params as signMsgDelegate);
      case TxType.MsgWithdrawDelegatorReward:
        return this.signMsgWithdrawDelegatorRewardTransaction(params as signMsgDelegate);
      default:
        throw new SDKError(signTransaction.name, 'Cannot specify transaction type with given data.');
    }
  }
}

export * as CHAIN from './chain';
export * as types from './types';
export { getCoin } from './utils/coin';
export { ChainProps, TxType };
export default Cosmos;
