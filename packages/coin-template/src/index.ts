import { coin as COIN, setting, apdu } from '@coolwallet/core';
import * as ethSign from './sign';
import { pubKeyToAddress } from './utils/ethUtils';
import * as types from './config/types';
import * as scriptUtils from './utils/scriptUtils';
import * as scriptUtilsEIP1559 from './utils/scriptUtilsEIP1559';
import * as params from './config/params';

type signTx = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  transaction: Transaction,
  addressIndex: number,
  publicKey: string | undefined,
  confirmCB: ()=>void | undefined,
  authorizedCB: ()=>void | undefined
}

type Transaction = {
  chainId: number,
  nonce: string,
  gasPrice: string,
  gasLimit: string,
  to: string,
  value: string,
  data: string,
}

export default class TEMP extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  async getAddress(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> {
    const publicKey = await this.getPublicKey(
      transport, appPrivateKey, appId, addressIndex
    );
    return pubKeyToAddress(publicKey);
  }

  async getAddressByAccountKey(
    accPublicKey: string,
    accChainCode: string,
    addressIndex: number
  ): Promise<string> {
    const publicKey = await this.getAddressPublicKey(
      accPublicKey, accChainCode, addressIndex
    );
    return pubKeyToAddress(publicKey);
  }

  async signTransaction(
    signTxData: signTx
  ): Promise<string> {
    const { value, data, to } = signTxData.transaction;

    const {
      transport, appPrivateKey, appId, addressIndex, transaction
    } = signTxData;

    const publicKey = await this.getPublicKey(
      transport, appPrivateKey, appId, addressIndex
    );
    const argument = await scriptUtils.getSmartContractArgument(
      transaction, addressIndex
    );
    const script = params.SmartContract.scriptWithSignature;

    return ethSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey,
    );
  }
}
