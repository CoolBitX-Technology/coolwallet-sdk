import { apdu, tx } from '@coolwallet/core';
import { SignTxData } from './config/types';

/*
 * sign XTZ Operation in CoolWallet
 */
export const signTransaction = async (
  signTxData: SignTxData,
  script: string,
  argument: string,
  publicKey: string
): Promise<string> => {
  const {
    transport, appPrivateKey, appId, confirmCB, authorizedCB
  } = signTxData;

  const preActions = [];
  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  };

  preActions.push(sendScript);

  const sendArgument = async () => apdu.tx.executeScript(
    transport,
    appId,
    appPrivateKey,
    argument
  );

  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    sendArgument,
    true,
    confirmCB,
    authorizedCB,
    false
  );
  
  return signature.toString('hex');
};