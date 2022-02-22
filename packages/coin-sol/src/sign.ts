import { tx, apdu, utils } from '@coolwallet/core';
import * as scriptUtil from './utils/scriptUtil';
import { signTxType } from './config/types';

export default async function signTransaction(
  signTxData: signTxType,
  transfer: { index: string; dataLength: string; script: string; signature: string }
): Promise<string> {
  const { transaction, transport, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];
  if (!transfer.index || !transfer.dataLength) throw new Error('Unsupported transaction type');
  transaction.txTypeIndex = transfer.index;
  transaction.dataLength = transfer.dataLength;
  const argument = await scriptUtil.getTransferArguments(transaction);

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
  const { signedTx: rawTx } = await apdu.tx.getSignedHex(transport);

  return '01' + (signature as Buffer).toString('hex') + rawTx;
}
