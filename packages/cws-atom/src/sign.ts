/* eslint-disable no-param-reassign */
import * as core from '@coolwallet/core';
import * as types from './config/types'


export const signTransaction = async (
  signData: types.signType,
  script: string,
  argument: string,
): Promise<{ r: string; s: string; } | Buffer> => {

  const { transport, appId, appPrivateKey, confirmCB, authorizedCB } = signData

  const preActions = [];
  let action;
  const sendScript = async () => {
    await core.apdu.tx.sendScript(transport, script);
  }
  preActions.push(sendScript);

  console.log("aaaaa: " + argument)

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

  return canonicalSignature;

};
