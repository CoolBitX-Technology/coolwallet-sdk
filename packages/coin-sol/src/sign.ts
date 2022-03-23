import { tx, apdu, utils } from '@coolwallet/core';
import * as scriptUtil from './utils/scriptUtil';
import { signTxType } from './config/types';
import { formTransaction } from './utils/transactionUtil';
import base58 from 'bs58';

async function signTransaction(
  signTxData: signTxType,
  transfer: { script: string; signature: string }
): Promise<Buffer> {
  const { transaction, transport, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const rawTx = formTransaction(transaction);
  const argument = await scriptUtil.getTransferArguments(rawTx);

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

  rawTx.signature = signature.toString('hex');

  return Buffer.from(rawTx.serialize(), 'hex');
}

export { signTransaction };
