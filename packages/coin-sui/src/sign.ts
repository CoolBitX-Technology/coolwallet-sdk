import { tx, apdu } from '@coolwallet/core';
import * as types from './config/types';
import { SignatureType } from '@coolwallet/core/lib/transaction';

async function executeScriptWithPreActions(
  signData: types.TransactionArgs,
  script: string,
  argument: string
): Promise<Buffer | { r: string; s: string }> {
  const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = signData;

  const preActions = [() => apdu.tx.sendScript(transport, script)];
  const action = () => apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

  return tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    confirmCB,
    authorizedCB,
    SignatureType.EDDSA
  );
}

async function signAllTransaction(
  signTxData: types.TransactionArgs,
  script: string,
  argument: string
): Promise<string> {
  const signature = (await executeScriptWithPreActions(signTxData, script, argument)) as Buffer;
  return signature.toString('hex');
}

export { signAllTransaction };
