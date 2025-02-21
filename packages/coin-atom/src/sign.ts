/* eslint-disable no-param-reassign */
import { tx, error } from '@coolwallet/core';
import * as types from './config/types'
import * as txUtil from './util/transactionUtil' 
import { SignatureType } from '@coolwallet/core/lib/transaction';


export const signTransaction = async (
  signData: types.SignDataType,
  script: string,
  argument: string
): Promise<string> => {

  const { transport, appId, appPrivateKey, confirmCB, authorizedCB } = signData

  const preActions = [];
  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const action = async () => {
    return tx.command.executeScript(
      transport,
      appId,
      appPrivateKey,
      argument
    );
  };
  
  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    SignatureType.Canonical,
    confirmCB,
    authorizedCB
  );

  const { signedTx } = await tx.command.getSignedHex(transport);
  console.debug("signedTx: ", signedTx);
  
  if (!Buffer.isBuffer(canonicalSignature)) {
    const atomSignature = await txUtil.genAtomSigFromSESig(canonicalSignature);
    return atomSignature;
  } else {
    throw new error.SDKError(signTransaction.name, 'canonicalSignature type error');
  }

};

