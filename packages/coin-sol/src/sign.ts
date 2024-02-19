import { tx, apdu } from '@coolwallet/core';
import * as types from './config/types';
import Transaction from './utils/Transaction';

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
  rawTx: Transaction,
  script: string,
  argument: string
): Promise<string> {
  const signature = await executeScriptWithPreActions(signTxData, script, argument);
  return rawTx.toTxString(signature.toString('hex'));
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
