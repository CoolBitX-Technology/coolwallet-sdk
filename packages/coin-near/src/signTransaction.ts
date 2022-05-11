import { tx, apdu /*, utils*/ } from '@coolwallet/core';
import { getScriptArg, getSignedTx } from './utils';
import * as types from './config/types';

export default async function signTransaction(signTxData: types.SignTxType): Promise<string> {
  const { transport, transaction } = signTxData;
  const { script, argument } = await getScriptArg(transaction);

  await apdu.tx.sendScript(transport, script);
  const encryptedSig = await apdu.tx.executeScript(transport, signTxData.appId, signTxData.appPrivateKey, argument);
  await apdu.tx.finishPrepare(transport);
  await apdu.tx.getTxDetail(transport);
  const decryptingKey = await apdu.tx.getSignatureKey(transport);
  await apdu.tx.clearTransaction(transport);
  await apdu.mcu.control.powerOff(transport);
  const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, true, false) as Buffer;
  return getSignedTx(transaction, sig);
}
