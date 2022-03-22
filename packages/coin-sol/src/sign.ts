import { tx, apdu, utils } from '@coolwallet/core';
import * as scriptUtil from './utils/scriptUtil';
import { signTxType } from './config/types';

async function signTransaction(
  signTxData: signTxType,
  transfer: { script: string; signature: string }
): Promise<Buffer> {
  const { message, transport, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const argument = await scriptUtil.getTransferArguments(message);
  console.log('🚀 ~ file: sign.ts ~ line 14 ~ argument', argument);

  const script = transfer.script + transfer.signature;

  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  };

  preActions.push(sendScript);

  const sendArgument = async () => {
    return apdu.tx.executeScript(transport, appId, appPrivateKey, argument);
  };

  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    sendArgument,
    true,
    confirmCB,
    authorizedCB
  );
  await utils.checkSupportScripts(transport);

  const { signedTx } = await apdu.tx.getSignedHex(transport);
  console.log('🚀 ~ file: sign.ts ~ line 27 ~ signedTx', signedTx);

  return signature as Buffer;
}

export { signTransaction };
