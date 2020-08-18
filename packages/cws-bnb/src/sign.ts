import { apdu, transport, tx, error, util } from '@coolwallet/core';
import * as bnbUtil from './util';
import { coinType, TransactionType, Transfer, PlaceOrder, CancelOrder } from './types'

type Transport = transport.default;

export async function transferSignature(
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  transactionType: TransactionType,
  readType: string,
  signObj: Transfer | PlaceOrder | CancelOrder,
  signPublicKey: Buffer,
  addressIndex: number,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined,
): Promise<string> {
  if (transactionType !== TransactionType.TRANSFER) {
    throw new error.SDKError(transferSignature.name, `Unsupport transactionType: '${transactionType}'`);
  }

  const canonicalSignature = await sign(
    transport,
    appId,
    appPrivateKey,
    transactionType,
    readType,
    signObj,
    addressIndex,
    confirmCB,
    authorizedCB
  );
  return bnbUtil.composeSignedTransacton(signObj as Transfer, canonicalSignature, signPublicKey)
}

export async function walletConnectSignature(
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  transactionType: TransactionType,
  readType: string,
  signObj: Transfer | PlaceOrder | CancelOrder,
  signPublicKey: {
    x: string;
    y: string;
  },
  addressIndex: number,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined,
): Promise<{
  signature: string,
  publicKey: string
}> {
  if (transactionType !== TransactionType.PLACE_ORDER
    && transactionType !== TransactionType.CANCEL_ORDER) {
    throw new error.SDKError(walletConnectSignature.name, `Unsupport transactionType: '${transactionType}'`);
  }

  const canonicalSignature = await sign(
    transport,
    appId,
    appPrivateKey,
    transactionType,
    readType,
    signObj,
    addressIndex,
    confirmCB,
    authorizedCB
  );

  const signature = canonicalSignature.r + canonicalSignature.s;
  const publicKey = "04" + signPublicKey.x + signPublicKey.y;
  return { signature, publicKey };
}

/**
 * Sign Binance Tranaction
 */
async function sign(
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  transactionType: TransactionType,
  readType: string,
  signObj: Transfer | PlaceOrder | CancelOrder,
  addressIndex: number,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined,
): Promise<{ r: string; s: string; }> {
  const useScript = await util.checkSupportScripts(transport);
  const preActions = [];
  let action;
  if (useScript) {
    const { script, argument } = bnbUtil.getScriptAndArguments(transactionType, addressIndex, signObj);
    console.log("script: " + script)
    console.log("argument: " + argument)
    const sendScript = async () => {
      await apdu.tx.sendScript(transport, script);
    }
    preActions.push(sendScript);

    action = async () => {
      return apdu.tx.executeScript(
        transport,
        appId,
        appPrivateKey,
        argument
      );
    }
  } else {
    const rawPayload = bnbUtil.convertObjectToSignBytes(signObj);
    console.log("rawPayload: " + typeof (rawPayload))
    console.log("rawPayload: " + rawPayload)
    const keyId = tx.util.addressIndexToKeyId(coinType, addressIndex);
    const dataForSE = tx.flow.prepareSEData(keyId, rawPayload, readType);

    const sayHi = async () => {
      await apdu.general.hi(transport, appId);
    }
    preActions.push(sayHi)

    action = async () => {
      return apdu.tx.txPrep(transport, dataForSE, "00", appPrivateKey);
    }
  }

  return await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  ) as { r: string; s: string; };
}
