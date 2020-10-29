import { apdu, transport, tx, error, util } from '@coolwallet/core';
import * as bnbUtil from './util';
import { coinType, TransactionType, Transfer, PlaceOrder, CancelOrder, signType } from './types'

type Transport = transport.default;

export async function transferSignature(
  signData: signType,
  denom: string,
  script: string,
  inputArgument: string,
): Promise<string> {
  // if (transactionType !== TransactionType.TRANSFER) {
  //   throw new error.SDKError(transferSignature.name, `Unsupport transactionType: '${transactionType}'`);
  // }

  const canonicalSignature = await sign(
    signData.transport,
    signData.appId,
    signData.appPrivateKey,
    signData.addressIndex,
    script,
    inputArgument,
    signData.confirmCB,
    signData.authorizedCB,
  );
  return bnbUtil.composeSignedTransacton(signData.signObj as Transfer, denom, canonicalSignature, signData.signPublicKey)
}

export async function walletConnectSignature(
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  addressIndex: number,
  script: string,
  inputArgument: string,
  confirmCB?: Function,
  authorizedCB?: Function
): Promise<string> {
  // if (transactionType !== TransactionType.PLACE_ORDER
  //   && transactionType !== TransactionType.CANCEL_ORDER) {
  //   throw new error.SDKError(walletConnectSignature.name, `Unsupport transactionType: '${transactionType}'`);
  // }

  const canonicalSignature = await sign(
    transport,
    appId,
    appPrivateKey,
    addressIndex,
    script,
    inputArgument,
    confirmCB,
    authorizedCB
  );

  return canonicalSignature.r + canonicalSignature.s;
}

/**
 * Sign Binance Tranaction
 */
async function sign(
  // signData: signType,
  transport: Transport,
  appId: string, 
  appPrivateKey: string,
  addressIndex: number,
  script: string,
  inputArgument: string,
  confirmCB?: Function,
  authorizedCB?: Function
): Promise<{ r: string; s: string; }> {

  // const transport = signData.transport;

  const preActions = [];
  let action;
  const argument = bnbUtil.getArguments(inputArgument, addressIndex);
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


/**
 * Sign Binance Tranaction
 */
async function sign100(
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
  const preActions = [];
  let action;

  const rawPayload = bnbUtil.convertObjectToSignBytes(signObj);
  const keyId = tx.util.addressIndexToKeyId(coinType, addressIndex);
  const dataForSE = tx.flow.prepareSEData(keyId, rawPayload, readType);

  const sayHi = async () => {
    await apdu.general.hi(transport, appId);
  }
  preActions.push(sayHi)

  action = async () => {
    return apdu.tx.txPrep(transport, dataForSE, "00", appPrivateKey);
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
