import * as Helper from '../../helper';
import * as ethUtil from './ethereum_utils';
import * as ethSign from './ethereum_sign';
import { ECDSACoin } from 'sdk-core';

export default class ETH extends ECDSACoin {
  constructor(wallet) {
    super(wallet, '3C');
  }

  /**
   * Sign Ethereum Transaction.
   * @param {String} payload
   * @param {Number} addressIndex
   * @param {String} publicKey
   */
  async signTransaction(payload, addressIndex, publicKey = undefined) {
    return await ethSign.signTransaction(this.coinType, payload, addressIndex, publicKey);
  }

  /**
   * Store token information to local storage, for later ERC20-transfer transaction
   * @param {String} contractAddress
   * @param {String} symbol
   * @param {Number} decimals
   * @return {Promise}
   */
  async registerToken(contractAddress, symbol, decimals) {
    await ethUtil.storeCustomToken(contractAddress, symbol, decimals);
  }

  /**
   * Sign Arbitrary Message.
   * @param {String} message hex or utf-8
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Boolean} isHashRequired
   * @return {Promise<String>}
   */
  async signMessage(message, addressIndex, publicKey = undefined, isHashRequired = false) {
    await Helper.Other.versionCheck(81);
    return await ethSign.signMessage(this.coinType, message, addressIndex, publicKey, isHashRequired);
  }

  /**
   * Sign EIP712 typed data
   * @param {Object} typedData
   * @param {String} addressIndex
   * @param {String} publicKey
   */
  async signTypedData(typedData, addressIndex, publicKey = undefined) {
    await Helper.Other.versionCheck(84);
    return await ethSign.signTypedData(this.coinType, typedData, addressIndex, publicKey);
  }
}
