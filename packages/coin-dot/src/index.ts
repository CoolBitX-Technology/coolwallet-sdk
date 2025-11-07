/* eslint-disable no-param-reassign */
import { coin as COIN } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import * as dotUtil from './utils/dotUtil';
import * as types from './config/types';
import * as params from './config/params';
import * as scriptUtil from './utils/scriptUtil';
import * as dotSign from './sign';
import { COIN_SPECIES } from './config/types';

export { payeeType } from './config/params';
export { COIN_SPECIES };

export default class DOT extends COIN.ECDSACoin implements COIN.Coin {
  scriptParams: any;

  addressType: any;

  constructor(type: string) {
    switch (type) {
      case COIN_SPECIES.KSM:
        super(params.COIN_TYPE.KSM);
        this.addressType = params.DOT_ADDRESS_TYPE.KSM;
        this.scriptParams = params.SCRIPT_PARAMS.KSM;
        break;
      case COIN_SPECIES.DOT:
      default:
        super(params.COIN_TYPE.DOT);
        this.addressType = params.DOT_ADDRESS_TYPE.DOT;
        this.scriptParams = params.SCRIPT_PARAMS.DOT;
    }
  }

  async getAddress(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.pubKeyToAddress(publicKey, this.addressType);
  }

  async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return txUtil.pubKeyToAddress(publicKey, this.addressType);
  }

  async signTransaction(signTxData: types.NormalTransferData) {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;
    const script = this.scriptParams.TRANSFER.script + this.scriptParams.TRANSFER.signature;

    // eslint-disable-next-line max-len
    const { method, methodString } = dotUtil.getNormalMethod(transaction.callIndex, transaction.method);
    const formatTxData = dotUtil.getFormatTxData(transaction);
    const argument = await scriptUtil.getNormalArgument(formatTxData, method, addressIndex, this.coinType);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(signTxData, script, argument, publicKey);

    return txUtil.getSubmitTransaction(transaction.fromAddress, formatTxData, methodString, signature, 4);
  }

  async signBondTransaction(signTxData: types.BondData) {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;
    const script = this.scriptParams.BOND.script + this.scriptParams.BOND.signature;
    const { method, methodString } = dotUtil.getBondMethod(transaction.callIndex, transaction.method);
    const formatTxData = dotUtil.getFormatTxData(transaction);
    const argument = await scriptUtil.getBondArgument(formatTxData, method, addressIndex, this.coinType);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(signTxData, script, argument, publicKey);

    return txUtil.getSubmitTransaction(transaction.fromAddress, formatTxData, methodString, signature, 4);
  }

  async signBondExtraTransaction(signTxData: types.BondExtraData) {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;
    const script = this.scriptParams.BOND_EXTRA.script + this.scriptParams.BOND_EXTRA.signature;
    const { method, methodString } = dotUtil.getBondExtraMethod(transaction.callIndex, transaction.method);
    const formatTxData = dotUtil.getFormatTxData(transaction);
    const argument = await scriptUtil.getBondExtraArgument(formatTxData, method, addressIndex, this.coinType);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(signTxData, script, argument, publicKey);

    return txUtil.getSubmitTransaction(transaction.fromAddress, formatTxData, methodString, signature, 4);
  }

  async signUnbondTransaction(signTxData: types.UnbondData) {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;
    const script = this.scriptParams.UNBOND.script + this.scriptParams.UNBOND.signature;
    const { method, methodString } = dotUtil.getUnbondMethod(transaction.callIndex, transaction.method);
    const formatTxData = dotUtil.getFormatTxData(transaction);
    const argument = await scriptUtil.getUnbondArgument(formatTxData, method, addressIndex, this.coinType);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(signTxData, script, argument, publicKey);

    return txUtil.getSubmitTransaction(transaction.fromAddress, formatTxData, methodString, signature, 4);
  }

  async signNominateTransaction(signTxData: types.NominateData) {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;
    // eslint-disable-next-line max-len
    const { method, methodString } = dotUtil.getNominateMethod(transaction.callIndex, transaction.method);

    let script;
    if (transaction.method.targetAddresses.length > 5) {
      script = this.scriptParams.NOMINATE.doubleHash.script + this.scriptParams.NOMINATE.doubleHash.signature;
    } else {
      script = this.scriptParams.NOMINATE.singleHash.script + this.scriptParams.NOMINATE.singleHash.signature;
    }

    const formatTxData = dotUtil.getFormatTxData(transaction);
    const argument = await scriptUtil.getNominateArgument(formatTxData, method, addressIndex, this.coinType);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(signTxData, script, argument, publicKey);

    return txUtil.getSubmitTransaction(transaction.fromAddress, formatTxData, methodString, signature, 4);
  }

  async signWithdrawUnbondedTransaction(signTxData: types.WithdrawUnbondedData) {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;
    const script = this.scriptParams.WITHDRAW.script + this.scriptParams.WITHDRAW.signature;
    const { method, methodString } = dotUtil.getWithdrawUnbondedMethod(transaction.callIndex, transaction.method);
    const formatTxData = dotUtil.getFormatTxData(transaction);
    const argument = await scriptUtil.getWithdrawUnbondedArgument(formatTxData, method, addressIndex, this.coinType);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(signTxData, script, argument, publicKey);

    return txUtil.getSubmitTransaction(transaction.fromAddress, formatTxData, methodString, signature, 4);
  }

  async signChillTransaction(signTxData: types.ChillData) {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;
    const script = this.scriptParams.CHILL.script + this.scriptParams.CHILL.signature;
    const methodString = dotUtil.getChillMethod(transaction.callIndex);
    const formatTxData = dotUtil.getFormatTxData(transaction);
    const argument = await scriptUtil.getChillArgument(formatTxData, methodString, addressIndex, this.coinType);
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const signature = await dotSign.signTransaction(signTxData, script, argument, publicKey);

    return txUtil.getSubmitTransaction(transaction.fromAddress, formatTxData, methodString, signature, 4);
  }
}
