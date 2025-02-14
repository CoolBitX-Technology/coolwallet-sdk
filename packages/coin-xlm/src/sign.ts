import { tx, utils } from '@coolwallet/core';
import * as scriptUtil from './utils/scriptUtil';
import { signTxType, PROTOCOL } from './config/types';
import { SignatureType } from '@coolwallet/core/lib/transaction';

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
    await tx.command.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const sendArgument = async () => {
    return tx.command.executeScript(transport, appId, appPrivateKey, argument);
  };

  const signature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    sendArgument,
    SignatureType.EDDSA,
    confirmCB,
    authorizedCB,
  );
  await utils.checkSupportScripts(transport);

  return signature;
}
