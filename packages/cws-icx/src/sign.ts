import { apdu, transport, error, tx, util } from '@coolwallet/core';
import * as icxUtil from './utils/util';

type Transport = transport.default;

/**
 * Sign ICON Transaction
 */
// eslint-disable-next-line import/prefer-default-export
export default async function signTransaction(
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  coinType: string,
  transaction: object,
  addressIndex: number,
  publicKey: string,
  confirmCB: Function | undefined = undefined,
  authorizedCB: Function | undefined = undefined
): Promise<Object> {
  const phraseToSign = icxUtil.generateHashKey(transaction);
  const rawPayload = Buffer.from(phraseToSign, 'utf-8');
  const useScript = await util.checkSupportScripts(transport);
  let canonicalSignature;
  const preActions = [];

  if (useScript) {
    const { script, argument } = icxUtil.getScriptAndArguments(addressIndex, transaction);
    
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
    
    canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
      transport,
      preActions,
      sendArgument,
      false,
      confirmCB,
      authorizedCB,
      true
    );
  } else {
    const keyId = tx.util.addressIndexToKeyId(coinType, addressIndex);

    const dataForSE = tx.flow.prepareSEData(keyId, rawPayload, coinType);

    const sayHi = async () => {
      await apdu.general.hi(transport, appId);
    }
    preActions.push(sayHi)

    const prepareTx = async () => {
      return apdu.tx.txPrep(transport, dataForSE, "00", appPrivateKey);
    }

    canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
      transport,
      preActions,
      prepareTx,
      false,
      confirmCB,
      authorizedCB,
      true
    );
  }

  const txObject = await icxUtil.generateRawTx(canonicalSignature, transaction, publicKey);
  return txObject;
};
