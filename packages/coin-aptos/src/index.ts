import { coin as COIN, Transport, apdu, tx } from '@coolwallet/core';
import { getPath, publicKeyToAuthenticationKey, getScript, getArgument } from './utils';
import * as params from './config/params';
import { Transaction, Options } from './config/types';

export default class APTOS extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  getAddress = () => {
    throw new Error('getAddress is not supported for aptos, please use getAuthKey instead');
  };

  getAuthKey = async (
    transport: Transport, appPrivateKey: string, appId: string, addressIndex: number
  ): Promise<string> => {
    const path = getPath(addressIndex);
    const publicKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
    const authenticationKey = publicKeyToAuthenticationKey(publicKey);
    return '0x' + authenticationKey;
  };

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

    // verification and return signed tx

    await apdu.tx.finishPrepare(transport);
    await apdu.tx.getTxDetail(transport);
    const decryptingKey = await apdu.tx.getSignatureKey(transport);
    await apdu.tx.clearTransaction(transport);
    await apdu.mcu.control.powerOff(transport);
    const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey);
    console.log('sig :', sig);

    return '';
  };
}
