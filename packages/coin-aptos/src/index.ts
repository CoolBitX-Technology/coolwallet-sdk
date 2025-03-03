/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { coin as COIN, Transport, tx, mcu, CardType } from '@coolwallet/core';
import * as params from './config/params';
import { Transaction, Options } from './config/types';
import { getPublicKeyByKeyIndex, publicKeyToAuthenticationKey, getScript, getArgument, getSignedTx } from './utils';

export { Transaction, Options };

export default class APTOS extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  getAddress = () => {
    throw new Error('getAddress is not supported for aptos, please use getAuthKey instead');
  };

  getAuthKey = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    keyIndex: number
  ): Promise<string> => {
    const publicKey = await getPublicKeyByKeyIndex(transport, appId, appPrivateKey, keyIndex);
    const authenticationKey = publicKeyToAuthenticationKey(publicKey);
    return '0x' + authenticationKey;
  };

  getFakeSignedTx = async (transaction: Transaction, options: Options): Promise<string> => {
    const { transport, appPrivateKey, appId } = options;
    const publicKey = await getPublicKeyByKeyIndex(transport, appId, appPrivateKey, transaction.keyIndex);
    return getSignedTx(transaction, publicKey);
  };

  signTransaction = async (transaction: Transaction, options: Options): Promise<string> => {
    const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = options;

    // prepare data

    const signScript = getScript();
    const signArgument = getArgument(transaction);
    console.log('signArgument :', signArgument);

    // request CoolWallet to sign tx
    await tx.command.sendScript(transport, signScript);
    const encryptedSig = await tx.command.executeScript(transport, appId, appPrivateKey, signArgument);
    if (!encryptedSig) throw new Error('executeScript fails to return signature');

    let sigBuf: { r: string; s: string, s32?: string } | Buffer;
    if (transport.cardType === CardType.Pro) {
      if (typeof confirmCB === 'function') confirmCB();
      // verify tx
      await tx.command.finishPrepare(transport);
      await tx.command.getTxDetail(transport);
      const decryptingKey = await tx.command.getSignatureKey(transport);
      await tx.command.clearTransaction(transport);
      await mcu.control.powerOff(transport);
      if (typeof authorizedCB === 'function') {
        authorizedCB();
      }
      sigBuf = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, tx.SignatureType.EDDSA) as Buffer;
    } else {
      sigBuf = tx.util.formatSignature(encryptedSig!, tx.SignatureType.EDDSA);
    }

    // construct signed tx
    const sig = sigBuf.toString('hex').padStart(128, '0');
    const publicKey = await getPublicKeyByKeyIndex(transport, appId, appPrivateKey, transaction.keyIndex);
    return getSignedTx(transaction, publicKey, sig);
  };
}
