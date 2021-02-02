/* eslint-disable no-param-reassign */
import * as core from '@coolwallet/core';
import * as types from './config/types'
import * as txUtil from './util/transactionUtil' 


export const signTransaction = async (
  signData: types.SignDataType,
  script: string,
  argument: string,
): Promise<string> => {

  const { transport, appId, appPrivateKey, confirmCB, authorizedCB } = signData

  const preActions = [];
  let action;
  const sendScript = async () => {
    await core.apdu.tx.sendScript(transport, script);
  }
  preActions.push(sendScript);

  action = async () => {
    return core.apdu.tx.executeScript(
      transport,
      appId,
      appPrivateKey,
      argument
    );
  }
  const canonicalSignature = await core.tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const atomSignature = await txUtil.genAtomSigFromSESig(canonicalSignature);
    return atomSignature;
  } else {
    throw new core.error.SDKError(signTransaction.name, 'canonicalSignature type error');
  }

};

