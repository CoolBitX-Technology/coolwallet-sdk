/* eslint-disable no-param-reassign */
import { coin as COIN, transport, setting } from '@coolwallet/core';
import * as ethSign from './sign';
import { pubKeyToAddress } from './utils/ethUtils';
import { coinType, Transaction } from './type'
import * as ethUtil from './utils/ethUtils';
import * as scripts from "./scripts";

type Transport = transport.default;
export default class ETH extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(coinType);
  }

  /**
   * Get Ethereum address by index
   * @param {number} addressIndex
   * @return {string}
   */
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return pubKeyToAddress(publicKey);
  }

  /**
   * Sign Ethereum Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
   * value:string, data:string, chainId: number}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signTransaction(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    transaction: Transaction,
    addressIndex: number,
    publicKey: string | undefined = undefined,
    confirmCB: Function | undefined = undefined,
    authorizedCB: Function | undefined = undefined
  ) {
    if (!publicKey) publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    const getArg = async () => {
      return ethUtil.getTransferArgument(transaction);
    }
    const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;

    const argument = await ethUtil.getArgument(addressIndex, getArg);
    return ethSign.signTransaction(
      transport,
      appId,
      appPrivateKey,
      transaction,
      script,
      argument,
      publicKey,
      confirmCB,
      authorizedCB
    );
  }


  /**
   * Sign Ethereum Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
   * value:string, data:string, chainId: number}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signERC20Transaction(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    transaction: Transaction,
    addressIndex: number,
    publicKey: string | undefined = undefined,
    confirmCB: Function | undefined = undefined,
    authorizedCB: Function | undefined = undefined
  ) {
    if (!publicKey) publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    const getArg = async () => {
      return ethUtil.getERC20Argument(transaction);
    }
    const script = scripts.ERC20.script + scripts.ERC20.signature;

    const argument = await ethUtil.getArgument(addressIndex, getArg);
    return ethSign.signTransaction(
      transport,
      appId,
      appPrivateKey,
      transaction,
      script,
      argument,
      publicKey,
      confirmCB,
      authorizedCB
    );
  }

  /**
   * Sign Arbitrary Message.
   * @param {String} message hex or utf-8
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Boolean} isHashRequired
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   * @return {Promise<String>}
   */
  async signMessage(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    message: string,
    addressIndex: number,
    publicKey: string | undefined = undefined,
    isHashRequired: boolean = false,
    confirmCB: Function | undefined = undefined,
    authorizedCB: Function | undefined = undefined
  ): Promise<string> {
    await setting.auth.versionCheck(transport, 81);
    if (!publicKey) {
      publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    }
    return ethSign.signMessage(
      transport,
      appId,
      appPrivateKey,
      this.coinType,
      message,
      addressIndex,
      publicKey,
      isHashRequired,
      confirmCB,
      authorizedCB
    );
  }

  /**
   * Sign EIP712 typed data
   * @param {Object} typedData
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signTypedData(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    typedData: object,
    addressIndex: number,
    publicKey: string | undefined = undefined,
    confirmCB: Function | undefined = undefined,
    authorizedCB: Function | undefined = undefined
  ) {
    await setting.auth.versionCheck(transport, 84);
    if (!publicKey) publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return ethSign.signTypedData(
      transport,
      appId,
      appPrivateKey,
      this.coinType,
      typedData,
      addressIndex,
      publicKey,
      confirmCB,
      authorizedCB
    );
  }
}

