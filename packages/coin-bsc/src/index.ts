/* eslint-disable no-param-reassign */
import { coin as COIN, setting } from "@coolwallet/core";
import * as sign from "./sign";
import { pubKeyToAddress } from "./utils/ethUtils";
import * as types from "./config/types";
import * as scriptUtils from "./utils/scriptUtils";
import * as params from "./config/params";
import { TOKENTYPE } from "./config/tokenType";

export { TOKENTYPE };

export default class BSC extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  /**
   * Get BSC address by index
   * @param {number} addressIndex
   * @return {string}
   */
  async getAddress(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> {
    const publicKey = await this.getPublicKey(
      transport,
      appPrivateKey,
      appId,
      addressIndex
    );
    return pubKeyToAddress(publicKey);
  }

  async getAddressByAccountKey(
    accPublicKey: string,
    accChainCode: string,
    addressIndex: number
  ): Promise<string> {
    const publicKey = await this.getAddressPublicKey(
      accPublicKey,
      accChainCode,
      addressIndex
    );
    return pubKeyToAddress(publicKey);
  }

  /**
   * Sign BSC Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
   * value:string, data:string}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signTransaction(signTxData: types.signTx) {
    const { value, data, to } = signTxData.transaction;

    // bsc
    if (value && !data) {
      return await this.signTransferTransaction(signTxData);
    }

    // bep20
    const functionHash = data.startsWith("0x")
      ? data.slice(2, 10)
      : data.slice(0, 8);

    if (data && functionHash === "a9059cbb") {
      const upperCaseAddress = to.toUpperCase(); // contractAddr
      let tokenSignature;
      for (const tokenInfo of TOKENTYPE) {
        // get tokenSignature
        if (tokenInfo.contractAddress.toUpperCase() === upperCaseAddress) {
          tokenSignature = tokenInfo.signature;
          signTxData.transaction.option.info.symbol = tokenInfo.symbol;
          signTxData.transaction.option.info.decimals = tokenInfo.unit;
          break;
        }
      }

      const { symbol, decimals } = signTxData.transaction.option.info;
      if (symbol && decimals) {
        if (tokenSignature) {
          // 內建
          return await this.signBEP20Transaction(signTxData, tokenSignature);
        } else {
          // 自建
          return await this.signBEP20Transaction(signTxData);
        }
      }
    }

    // smart contract
    return await this.signSmartContractTransaction(signTxData);
  }

  /**
   * Sign BSC Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
   * value:string, data:string}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signTransferTransaction(signTxData: types.signTx) {
    const publicKey = await this.getPublicKey(
      signTxData.transport,
      signTxData.appPrivateKey,
      signTxData.appId,
      signTxData.addressIndex
    );
    const argument = await scriptUtils.getTransferArgument(
      signTxData.transaction,
      signTxData.addressIndex
    );
    const script = params.TRANSFER.script + params.TRANSFER.signature;

    return sign.signTransaction(signTxData, script, argument, publicKey);
  }

  /**
   * Sign BEP20 Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
   * value:string, data:string}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signBEP20Transaction(
    signTxData: types.signTx,
    tokenSignature = ""
  ) {
    const publicKey = await this.getPublicKey(
      signTxData.transport,
      signTxData.appPrivateKey,
      signTxData.appId,
      signTxData.addressIndex
    );
    const script = params.BEP20.script + params.BEP20.signature;
    const argument = await scriptUtils.getBEP20Argument(
      signTxData.transaction,
      tokenSignature,
      signTxData.addressIndex
    );

    return sign.signTransaction(signTxData, script, argument, publicKey);
  }

  /**
   * Sign SmartContract Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
   * value:string, data:string}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signSmartContractTransaction(signTxData: types.signTx) {
    console.debug("signSmartContractTransaction");

    const publicKey = await this.getPublicKey(
      signTxData.transport,
      signTxData.appPrivateKey,
      signTxData.appId,
      signTxData.addressIndex
    );
    const script =
      params.BSCSmartContract.script + params.BSCSmartContract.signature;
    const argument = await scriptUtils.getSmartContractArgument(
      signTxData.transaction,
      signTxData.addressIndex
    );

    return sign.signTransaction(signTxData, script, argument, publicKey);
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
  async signMessage(signMsgData: types.signMsg): Promise<string> {
    await setting.auth.versionCheck(signMsgData.transport, 81);

    const publicKey = await this.getPublicKey(
      signMsgData.transport,
      signMsgData.appPrivateKey,
      signMsgData.appId,
      signMsgData.addressIndex
    );
    const script = params.SIGN_MESSAGE.script + params.SIGN_MESSAGE.signature;
    const argument = await scriptUtils.getSignMessageArgument(
      signMsgData.message,
      signMsgData.addressIndex
    );

    return sign.signMessage(signMsgData, script, argument, publicKey);
  }

  /**
   * Sign EIP712 typed data
   * @param {Object} typedData
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signTypedData(typedData: types.signTyped) {
    await setting.auth.versionCheck(typedData.transport, 84);
    const publicKey = await this.getPublicKey(
      typedData.transport,
      typedData.appPrivateKey,
      typedData.appId,
      typedData.addressIndex
    );
    const script =
      params.SIGN_TYPED_DATA.script + params.SIGN_TYPED_DATA.signature;

    return sign.signTypedData(typedData, script, publicKey);
  }
}

