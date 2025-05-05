import { tx } from '@coolwallet/core';
import { SignTxData } from './config/types';
import { SignatureType } from '@coolwallet/core/lib/transaction';

/*
 * sign XTZ Operation in CoolWallet
 */
export const signTransaction = async (
  signTxData: SignTxData,
  script: string,
  argument: string
): Promise<string> => {
  const {
    transport, appPrivateKey, appId, confirmCB, authorizedCB
  } = signTxData;

  const preActions = [];
  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  };

  preActions.push(sendScript);

  const sendArgument = async () => tx.command.executeScript(
    transport,
    appId,
    appPrivateKey,
    argument
  );

  const signature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    sendArgument,
    SignatureType.EDDSA,
    confirmCB,
    authorizedCB,
  );
  
  return signature.toString('hex');
};