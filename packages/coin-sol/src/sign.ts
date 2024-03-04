import { tx, apdu } from '@coolwallet/core';
import * as types from './config/types';
import { MessageV0, VersionedMessage } from './message';

import { Transaction } from './utils/Transaction';
import { VersionedTransaction } from './utils/versionedTransaction';

async function executeScriptWithPreActions(
  signData: types.SignDataType,
  script: string,
  argument: string
): Promise<Buffer|{ r: string;s: string;}> {
  const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = signData;

  const preActions = [() => apdu.tx.sendScript(transport, script)];
  const action = () => apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

  return tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    true,
    confirmCB,
    authorizedCB
  );
}

async function signTransaction(
  signTxData: types.signTxType,
  rawTx: Transaction | VersionedMessage,
  script: string,
  argument: string
): Promise<string> {
  const signature = await executeScriptWithPreActions(signTxData, script, argument);

  if (rawTx instanceof MessageV0) {
    let signatureUint8Array: Uint8Array;
    if (signature instanceof Buffer) {
      signatureUint8Array = new Uint8Array(signature);
    } else {
      const rBuffer = Buffer.from(signature.r, 'hex');
      const sBuffer = Buffer.from(signature.s, 'hex');
      signatureUint8Array = new Uint8Array([...rBuffer, ...sBuffer]);
    }
    return new VersionedTransaction(rawTx, [signatureUint8Array]).serialize().toString();
  }else if (rawTx instanceof Transaction){
    return rawTx.toTxString(signature.toString('hex'));
  }else{
    throw new Error('Invalid transaction type');
  }
}

async function signMessage(
  signMsgData: types.signMsgType,
  script: string,
  argument: string
): Promise<string> {
  const signature = await executeScriptWithPreActions(signMsgData, script, argument);
  return signature.toString('hex');
}
export { signTransaction, signMessage };
