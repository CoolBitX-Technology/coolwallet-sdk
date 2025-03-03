import * as core from '@coolwallet/core';
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
    await core.apdu.tx.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const action = async () => {
    return core.apdu.tx.executeScript(transport, appId, appPrivateKey, argument);
  };

  const canonicalSignature = await core.tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  const { signedTx } = await core.apdu.tx.getSignedHex(transport);
  console.debug('signedTx: ', signedTx);

  if (!Buffer.isBuffer(canonicalSignature)) {
    const croSignature = await txUtil.genCROSigFromSESig(canonicalSignature);
    return croSignature;
  } else {
    throw new core.error.SDKError(signTransaction.name, 'canonicalSignature type error');
  }
};
