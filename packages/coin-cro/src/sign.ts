import { error, tx } from '@coolwallet/core';
import * as types from './config/types';
import * as txUtil from './utils/transactionUtils';

export const signTransaction = async (
  signData: types.SignDataType,
  script: string,
  argument: string
): Promise<string> => {
  const { transport, appId, appPrivateKey, confirmCB, authorizedCB } = signData;

  const preActions = [];
  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const action = async () => {
    return tx.command.executeScript(transport, appId, appPrivateKey, argument);
  };

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    tx.SignatureType.Canonical,
    confirmCB,
    authorizedCB
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const croSignature = await txUtil.genCROSigFromSESig(canonicalSignature);
    return croSignature;
  } else {
    throw new error.SDKError(signTransaction.name, 'canonicalSignature type error');
  }
};
