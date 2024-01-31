import { tx, apdu } from '@coolwallet/core';
import * as types from './config/types';
import Transaction from './utils/Transaction';

async function signTransaction(
  signTxData: types.signTxType,
  rawTx: Transaction,
  script: string,
  argument: string
): Promise<string> {
  const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [() => apdu.tx.sendScript(transport, script)];

  const action = () => apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    true,
    confirmCB,
    authorizedCB
  );

  return rawTx.toTxString(signature.toString('hex'));
}

async function signMessage(signMsgData: types.signMsgType, script: string, argument: string): Promise<string> {
  const { transport } = signMsgData;

  const preActions = [() => apdu.tx.sendScript(transport, script)];

  const action = async () => {
    return apdu.tx.executeScript(transport, signMsgData.appId, signMsgData.appPrivateKey, argument);
  };

  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    signMsgData.confirmCB,
    signMsgData.authorizedCB,
    true
  );

  return signature.toString('hex');
}
export { signTransaction, signMessage };
