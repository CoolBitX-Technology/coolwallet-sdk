import { coin as COIN, Transport } from '@coolwallet/core';
import * as ethSign from './sign';
import { pubKeyToAddress } from './utils/ethUtils';
import * as params from './config/params';
import * as types from './config/types';
import * as scriptUtils from './utils/scriptUtils';
import { TOKENTYPE } from './config/tokenType';

export default class CRO extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return pubKeyToAddress(publicKey);
  }

  getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): string {
    const publicKey = this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return pubKeyToAddress(publicKey);
  }

  async signTransaction(signTxData: types.signTx): Promise<string> {
    const { value, data, to } = signTxData.transaction;
    // eth
    if (value && !data) {
      return this.signTransferTransaction(signTxData);
    }

    // erc20
    const functionHash = data.startsWith('0x') ? data.slice(2, 10) : data.slice(0, 8);

    if (data && functionHash === 'a9059cbb') {
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
          return this.signERC20Transaction(signTxData, tokenSignature);
        }
        // 自建
        return this.signERC20Transaction(signTxData);
      }
    }

    // smart contract
    return this.signSmartContractTransaction(signTxData);
  }

  async signTransferTransaction(signTxData: types.signTx): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, transaction } = signTxData;
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    const argument = await scriptUtils.getTransferArgument(transaction, addressIndex);
    const script = params.TRANSFER.scriptWithSignature;

    return ethSign.signTransaction(signTxData, script, argument, publicKey);
  }

  async signERC20Transaction(signTxData: types.signTx, tokenSignature = ''): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, transaction } = signTxData;
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    const argument = await scriptUtils.getERC20Argument(transaction, tokenSignature, addressIndex);
    const script = params.ERC20.scriptWithSignature;

    return ethSign.signTransaction(signTxData, script, argument, publicKey);
  }

  async signSmartContractTransaction(signTxData: types.signTx): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, transaction } = signTxData;
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    const argument = await scriptUtils.getSmartContractArgument(transaction, addressIndex);
    const script = params.SmartContract.scriptWithSignature;

    return ethSign.signSmartContractTransaction(signTxData, script, argument, publicKey);
  }
}
