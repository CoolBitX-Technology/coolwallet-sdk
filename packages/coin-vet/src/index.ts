import { coin as COIN, Transport } from '@coolwallet/core';
import { signCertificate, signTransaction, signToken, signVIP191 } from './sign';
import * as txUtil from './utils/transactionUtil';
import * as params from './config/params';
import * as types from './config/types';
import { TOKENTYPE } from './config/tokenType';

export default class VET extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  /**
   * Get VET address by index
   */
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.pubKeyToAddress(publicKey);
  }

  async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return txUtil.pubKeyToAddress(publicKey);
  }

  /**
   * Sign VET VIP191 Transaction.
   */
  async signVIP191Transaction(signTxData: types.signTxType): Promise<string> {
    const publicKey = await this.getPublicKey(
      signTxData.transport,
      signTxData.appPrivateKey,
      signTxData.appId,
      signTxData.addressIndex
    );

    return signTransaction(signTxData, publicKey);
  }

  /**
   * Sign VET VIP191 Transaction for origin (user).
   */
  async signVIP191TransactionOrigin(signTxData: types.signTxType): Promise<string> {
    const publicKey = await this.getPublicKey(
      signTxData.transport,
      signTxData.appPrivateKey,
      signTxData.appId,
      signTxData.addressIndex
    );

    return signVIP191(signTxData, publicKey);
  }

  /**
   * Sign VET Transaction.
   */
  async signTransaction(signTxData: types.signTxType): Promise<string> {
    const { reserved } = signTxData.transaction;

    const publicKey = await this.getPublicKey(
      signTxData.transport,
      signTxData.appPrivateKey,
      signTxData.appId,
      signTxData.addressIndex
    );

    if (reserved != null) {
      return this.signVIP191Transaction(signTxData);
    }

    return signTransaction(signTxData, publicKey);
  }

  /**
   * Sign VTHO Transaction.
   */
  async signToken(signTxData: types.signTxType): Promise<string> {
    const publicKey = await this.getPublicKey(
      signTxData.transport,
      signTxData.appPrivateKey,
      signTxData.appId,
      signTxData.addressIndex
    );

    const { clauses } = signTxData.transaction;
    let to: string = '';
    if (clauses[0].to != null) {
      to = clauses[0].to;
    }
    const upperCaseAddress = to.toUpperCase();
    for (const tokenInfo of TOKENTYPE) {
      if (tokenInfo.contractAddress.toUpperCase() === upperCaseAddress) {
        signTxData.transaction.option = {
          info: {
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.unit,
          },
        };
        return signToken(signTxData, publicKey);
      }
    }

    return signTransaction(signTxData, publicKey);
  }

  /**
   * Sign VET Certificate.
   */
  async signCertificate(signTxData: types.signCertType): Promise<string> {
    const publicKey = await this.getPublicKey(
      signTxData.transport,
      signTxData.appPrivateKey,
      signTxData.appId,
      signTxData.addressIndex
    );

    return signCertificate(signTxData, publicKey);
  }
}
