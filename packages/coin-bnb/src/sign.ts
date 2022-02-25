import { Transport, apdu, tx } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import * as types from './config/types'

export async function sign(
  transport: Transport,
  appId: string, 
  appPrivateKey: string,
  script: string,
  argument: string,
  confirmCB?: Function,
  authorizedCB?: Function
): Promise<string> {

  const preActions = [];
  let action;
  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  }
  preActions.push(sendScript);

  action = async () => {
    return apdu.tx.executeScript(
      transport,
      appId,
      appPrivateKey,
      argument
    );
  }

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
  ) as { r: string; s: string; };

  const signature = canonicalSignature.r + canonicalSignature.s;
  return signature;
}

