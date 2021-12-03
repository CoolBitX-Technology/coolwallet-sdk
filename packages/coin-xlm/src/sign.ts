import { tx, apdu, utils } from '@coolwallet/core';
import * as scriptUtil from './utils/scriptUtil';
import { signTxType, PROTOCOL } from './config/types';

// const accountIndexToKeyId = (coinType: string, accountIndex: number) => {
//   const accountIndexHex = accountIndex.toString(16).padStart(2, '0');
//   const keyId = coinType.concat(accountIndexHex).concat('000000');
//   return keyId;
// };

export default async function signTransaction(
  signTxData: signTxType,
  transfer: { script: string; signature: string },
  protocol: PROTOCOL
): Promise<{ r: string; s: string } | Buffer> {
  const { transaction, transport, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];

  const { script, argument } = await scriptUtil.getScriptAndArguments(transaction, transfer, protocol);

  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const sendArgument = async () => {
    return await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);
  };

  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    sendArgument,
    true,
    confirmCB,
    authorizedCB,
    false
  );
  await utils.checkSupportScripts(transport);

  return signature;
}
