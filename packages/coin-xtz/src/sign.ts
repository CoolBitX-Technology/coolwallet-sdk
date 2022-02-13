import { apdu, /*transport, */tx } from '@coolwallet/core';

//type Transport = transport.default;

/*
 * sign XTZ Operation in CoolWallet
 */
export const signTransaction = async (
  signTxData: any,
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

  const action = async () => apdu.tx.executeScript(
    transport,
    appId,
    appPrivateKey,
    argument
  );

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  );
  
  //const signature = await txUtil.getCompleteSignature(transport, publicKey, canonicalSignature)
  //console.debug("signature: ", signature)

  //const { signedTx } = await apdu.tx.getSignedHex(transport);
  //console.debug("signedTx: ", signedTx)

  return canonicalSignature.toString('hex');
};