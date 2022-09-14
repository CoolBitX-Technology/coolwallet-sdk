/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { coin as COIN, Transport, apdu, tx } from '@coolwallet/core';
import * as params from './config/params';
import { Transaction, Options } from './config/types';
import {
  getPublicKeyByKeyIndex,
  publicKeyToAuthenticationKey,
  getScript,
  getArgument,
  getSignedTx,
} from './utils';

export { Transaction, Options };

export default class APTOS extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  getAddress = () => {
    throw new Error('getAddress is not supported for aptos, please use getAuthKey instead');
  };

  getPubAndAuthKey = async (
    transport: Transport, appPrivateKey: string, appId: string, keyIndex: number
  ): Promise<{ pubKey: string, authKey: string }> => {
    const publicKey = await getPublicKeyByKeyIndex(transport, appId, appPrivateKey, keyIndex);
    const authenticationKey = publicKeyToAuthenticationKey(publicKey);
    return { pubKey: '0x' + publicKey, authKey: '0x' + authenticationKey };
  };

  getFakeSignedTx = async (transaction: Transaction, options: Options): Promise<string> => {
    const { transport, appPrivateKey, appId } = options;
    const publicKey = await getPublicKeyByKeyIndex(transport, appId, appPrivateKey, transaction.keyIndex);
    return getSignedTx(transaction, publicKey);
  }

  signTransaction = async (transaction: Transaction, options: Options): Promise<string> => {

    const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = options;

    // prepare data

    const signScript = getScript();
    const signArgument = getArgument(transaction);
    console.log('signArgument :', signArgument);

    // request CoolWallet to sign tx

    await apdu.tx.sendScript(transport, signScript);
    const encryptedSig = await apdu.tx.executeScript(transport, appId, appPrivateKey, signArgument);
    if (!encryptedSig) throw new Error('executeScript fails to return signature');

    if (typeof confirmCB === "function")
      confirmCB();

    // verify tx

    await apdu.tx.finishPrepare(transport);
    await apdu.tx.getTxDetail(transport);
    const decryptingKey = await apdu.tx.getSignatureKey(transport);
    await apdu.tx.clearTransaction(transport);
    await apdu.mcu.control.powerOff(transport);

    if (typeof authorizedCB === "function") {
      authorizedCB();
    }

    // construct signed tx

    const publicKey = await getPublicKeyByKeyIndex(transport, appId, appPrivateKey, transaction.keyIndex);
    const sigBuf = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, true, false) as Buffer;
    const sig = sigBuf.toString('hex').padStart(128,'0');
    return getSignedTx(transaction, publicKey, sig);
  };
}
