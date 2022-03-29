import { tx, apdu/*, utils*/ } from '@coolwallet/core';
import * as scriptUtil from './utils/scriptUtil';
import * as types from './config/types';

// const accountIndexToKeyId = (coinType: string, accountIndex: number) => {
//   const accountIndexHex = accountIndex.toString(16).padStart(2, '0');
//   const keyId = coinType.concat(accountIndexHex).concat('000000');
//   return keyId;
// };

export default async function signTransaction(
  signTxData: types.signTxType
): Promise<string> {

  const preActions = [];

  console.log('transaction : ' + signTxData.transaction.amount);

  const { script, argument } = await scriptUtil.getScriptAndArguments(signTxData.transaction);

  console.log('script : ' + await script);
  console.log('argument : ' + await argument);

  // const sendScript = async () => {
  //   await apdu.tx.sendScript(signTxData.transport, script);
  // };
  // preActions.push(sendScript);

  // const action = async () => {
  //   return apdu.tx.executeScript(signTxData.transport, signTxData.appId, signTxData.appPrivateKey, '15328000002C8000018d8000000000000000000000000000000000000098968010000000616c65785f73636e2e746573746e6574009f6203c849d3b9bb51e46dba6f26452eae8b745efc613476ef59799a86e72ce3029e0b0e1e4d000011000000616c65785f73636e322e746573746e657484d25c651b1d6eed9de743b708e6017ec0a7d2ee30899688d90486d13fd77c780100000003000080716433b629a33d010000000000'/*await argument*/);
  // };

  // const signature = await tx.flow.getSingleSignatureFromCoolWallet(
  //   signTxData.transport,
  //   preActions,
  //   action,
  //   true,
  //   signTxData.confirmCB,
  //   signTxData.authorizedCB,
  //   false
  // );
  //await utils.checkSupportScripts(transport);

  return '';//signature;
}
