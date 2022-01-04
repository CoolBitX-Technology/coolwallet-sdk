import { apdu, tx } from '@coolwallet/core';
import { signTxType } from './config/types';
import * as scriptUtil from './utils/scriptUtil';
import * as params from './config/params';

export async function signTransaction(signTxData: signTxType): Promise<string> {
  const { scriptType: redeemScriptType, transport, appId, appPrivateKey, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const script = params.TRANSFER.script + params.TRANSFER.signature;
  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const argument = await scriptUtil.getPaymentArgument(signTxData);
  const sendArgument = async () => {
    await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);
  };

  const signatures = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    sendArgument,
    false,
    confirmCB,
    authorizedCB,
    false
  );
  // TODO
  const transaction = Buffer.from('', 'hex');
  //const transaction = txUtil.composeFinalTransaction(redeemScriptType, preparedData, signatures as Buffer[]);
  return transaction.toString('hex');
}
