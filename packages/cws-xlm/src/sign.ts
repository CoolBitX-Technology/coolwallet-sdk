import { transport, tx, apdu, util } from '@coolwallet/core';
import * as xlmUtil from './utils';

type Transport = transport.default;
type protocol = import('./types').protocol

const accountIndexToKeyId = (coinType: string, accountIndex: number) => {
  const accountIndexHex = accountIndex.toString(16).padStart(2, '0');
  const keyId = coinType.concat(accountIndexHex).concat('000000');
  return keyId;
};

export default async function signTransaction(
  transport: Transport,
  appPrivateKey: string,
  apppublicKeys: {from: string , to: string} ,
  appId: string,
  coinType: string,
  signatureBase: Buffer,
  transaction: object,
  accountIndex: number,
  protocol: protocol,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
): Promise<{ r: string; s: string; } | Buffer> {
  const readType = protocol === 'BIP44' ? coinType : `${coinType}10`;
  const preActions = [];
  const useScript = await util.checkSupportScripts(transport);

  let signature;

  console.log("useScript: " + useScript)

  if (useScript) {


    const { script, argument } = xlmUtil.getScriptAndArguments(apppublicKeys, accountIndex, transaction, coinType);

    const sendScript = async () => {
      await apdu.tx.sendScript(transport, script);
    }
    preActions.push(sendScript);

    const sendArgument = async () => {
      return await apdu.tx.executeScript(
        transport,
        appId,
        appPrivateKey,
        argument
      );
    }

    signature = await tx.flow.getSingleSignatureFromCoolWallet(
      transport,
      preActions,
      sendArgument,
      true,
      confirmCB,
      authorizedCB,
      false,
    );
  }else{
    // 100 flow
    const keyId = accountIndexToKeyId(coinType, accountIndex);
    const dataForSE = tx.flow.prepareSEData(keyId, signatureBase, readType);


    const sayHi = async () => {
      await apdu.general.hi(transport, appId);
    }
    preActions.push(sayHi)

    const prepareTx = async () => {
      return apdu.tx.txPrep(transport, dataForSE, "00", appPrivateKey);
    }


    signature = await tx.flow.getSingleSignatureFromCoolWallet(
      transport,
      preActions,
      prepareTx,
      true,
      confirmCB,
      authorizedCB,
      false,
    );

  }
  

  return signature;
}
