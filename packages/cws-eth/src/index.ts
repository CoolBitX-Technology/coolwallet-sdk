/* eslint-disable no-param-reassign */
import { coin as COIN, transport, setting } from '@coolwallet/core';
import * as ethSign from './sign';
import { pubKeyToAddress } from './utils/ethUtils';
import { coinType, signTx, transactionType, signMsg, signTyped } from './type'
import * as ethUtil from './utils/ethUtils';
import * as scripts from "./scripts";
import { TOKENTYPE } from "./tokenType";
import { removeHex0x } from "./utils/stringUtil";

export {
  transactionType, TOKENTYPE
};

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
    signTxData: signTx
  ) {
    const txData = signTxData.transaction;

    // eth
    if (txData.value && !txData.data) {
      console.log("eth signTransaction")
      return await this.signTransferTransaction(signTxData);
    }

    // erc20
    const functionHash = txData.data.slice(2, 10);
    console.log(functionHash)
    if (txData.data && functionHash === 'a9059cbb') {

      const upperCaseAddress = txData.to.toUpperCase(); // contractAddr
      let tokenSignature;
      for (let tokenInfo of TOKENTYPE) { // get tokenSignature
        if (removeHex0x(tokenInfo.contractAddress).toUpperCase() ===  upperCaseAddress) {
          tokenSignature = tokenInfo.signature;
          break;
        }
      }
      if (tokenSignature) {
        return await this.signERC20Transaction(signTxData, tokenSignature); // 內建
      }

      if (txData.option.transactionType == transactionType.ERC20 && txData.option.info.decimals && txData.option.info.decimals) { // 自建
        return await this.signERC20Transaction(signTxData);
      }
    }

    // smart contract
    return await this.signSmartContractTransaction(signTxData);


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
  async signTransferTransaction(
    signTxData: signTx
  ) {
    const publicKey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, signTxData.addressIndex);
    const getArg = async () => {
      return ethUtil.getTransferArgument(signTxData.transaction);
    }
    const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;

    const argument = await ethUtil.getArgument(signTxData.addressIndex, getArg);
    
    return ethSign.signTransaction(
      signTxData.transport,
      signTxData.appId,
      signTxData.appPrivateKey,
      signTxData.transaction,
      script,
      argument,
      publicKey,
      signTxData.confirmCB,
      signTxData.authorizedCB
    );
  }


  /**
   * Sign ERC20 Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
   * value:string, data:string, chainId: number}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signERC20Transaction(
    signTxData: signTx, tokenSignature: string = ''
  ) {

    const publicKey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, signTxData.addressIndex);

    const getArg = async () => {
      return ethUtil.getERC20Argument(signTxData.transaction, tokenSignature);
    }

    const script = scripts.ERC20.script + scripts.ERC20.signature;

    const argument = await ethUtil.getArgument(signTxData.addressIndex, getArg);

    return ethSign.signTransaction(
      signTxData.transport,
      signTxData.appId,
      signTxData.appPrivateKey,
      signTxData.transaction,
      script,
      argument,
      publicKey,
      signTxData.confirmCB,
      signTxData.authorizedCB
    );
  }


  /**
   * Sign SmartContract Transaction.
   * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
   * value:string, data:string, chainId: number}} transaction
   * @param {Number} addressIndex
   * @param {String} publicKey
   * @param {Function} confirmCB
   * @param {Function} authorizedCB
   */
  async signSmartContractTransaction(
    signTxData: signTx
  ) {

    const publicKey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, signTxData.addressIndex);

    const getArg = async () => {
      return ethUtil.getSmartContractArgument(signTxData.transaction);
    }

    const script = scripts.ETHSmartContract.script + scripts.ETHSmartContract.signature;

    const argument = await ethUtil.getArgument(signTxData.addressIndex, getArg);

    return ethSign.signTransaction(
      signTxData.transport,
      signTxData.appId,
      signTxData.appPrivateKey,
      signTxData.transaction,
      script,
      argument,
      publicKey,
      signTxData.confirmCB,
      signTxData.authorizedCB
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
    signMsgData: signMsg
  ): Promise<string> {
    await setting.auth.versionCheck(signMsgData.transport, 81);

    const publicKey = await this.getPublicKey(signMsgData.transport, signMsgData.appPrivateKey, signMsgData.appId, signMsgData.addressIndex);

    return ethSign.signMessage(
      signMsgData,
      publicKey
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
    typedData: signTyped
  ) {
    console.log('111111111111')
    await setting.auth.versionCheck(typedData.transport, 84);
    const publicKey = await this.getPublicKey(typedData.transport, typedData.appPrivateKey, typedData.appId, typedData.addressIndex);
    return ethSign.signTypedData(
      typedData,
      publicKey,
    );
  }
}
