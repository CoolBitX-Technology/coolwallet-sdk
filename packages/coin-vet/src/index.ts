/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { coin as COIN, Transport, apdu, tx } from '@coolwallet/core';
import * as utils from './utils';
import * as params from './config/params';
import tokenInfos from './config/tokenInfos';
import { CoolWalletParam, Param, TxParam, TokenParam, CertParam, SignType } from './config/types';

export default class VET extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  /**
   * Get VET address by index
   */
  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return utils.pubKeyToAddress(publicKey);
  }

  async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return utils.pubKeyToAddress(publicKey);
  }

  async signBase(cwParam: CoolWalletParam, param: Param, signType: SignType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, confirmCB, authorizedCB } = cwParam;
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    let newParam;

    // check if an official token
    if (signType === SignType.Transaction) {
      const clause = (param as TxParam).clauses[0];
      if (clause && clause.to !== null && !clause.value) {
        const to = utils.handleHex(clause.to).toLowerCase();
        const data = utils.handleHex(clause.data).toLowerCase();
        const functionHash = data.slice(0, 8);
        const info = tokenInfos.find((i) => {
          return utils.handleHex(i.contractAddress).toLowerCase() === to;
        });
        if (functionHash === 'a9059cbb' && info) {
          signType = SignType.Token;
          newParam = {
            ...param,
            contractAddress: to,
            recipient: data.slice(32, 72),
            value: '0x' + data.slice(72),
            symbol: info.symbol,
            decimals: info.decimals,
          };
        }
      }
    }
    if (!newParam) newParam = param;

    // prepare data

    const { script, argument } = utils.getScriptAndArguments(addressIndex, newParam, signType);

    // request CoolWallet to sign tx

    await apdu.tx.sendScript(transport, script);
    const encryptedSig = await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);
    if (!encryptedSig) throw new Error('executeScript fails to return signature');
    if (typeof confirmCB === "function") confirmCB();

    // verify tx

    await apdu.tx.finishPrepare(transport);
    await apdu.tx.getTxDetail(transport);
    const decryptingKey = await apdu.tx.getSignatureKey(transport);
    await apdu.tx.clearTransaction(transport);
    await apdu.mcu.control.powerOff(transport);
    if (typeof authorizedCB === "function") authorizedCB();

    // construct signed tx

    const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey);
    const signedTx = utils.getSignedTransaction(newParam, sig as { r: string; s: string }, publicKey, signType);
    return '0x' + signedTx;
  }

  async signTransaction(cwParam: CoolWalletParam, txParam: TxParam): Promise<string> {
    return this.signBase(cwParam, txParam, SignType.Transaction);
  }

  async signToken(cwParam: CoolWalletParam, tokenParam: TokenParam): Promise<string> {
    return this.signBase(cwParam, tokenParam, SignType.Token);
  }

  async signCertificate(cwParam: CoolWalletParam, certParam: CertParam): Promise<string> {
    return this.signBase(cwParam, certParam, SignType.Certification);
  }
}
