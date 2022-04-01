import { tx, apdu, utils } from '@coolwallet/core';
import * as scriptUtil from './utils/scriptUtil';
import { signTxType } from './config/types';
import { formTransaction } from './utils/transactionUtil';
import * as params from './config/params';

async function signTransaction(signTxData: signTxType, txType: string): Promise<Buffer> {
  const { transaction, transport, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const rawTx = formTransaction(transaction, txType);
  const argument = await scriptUtil.getTransferArguments(rawTx);

  const script = params.SCRIPT[txType].getScript();

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
