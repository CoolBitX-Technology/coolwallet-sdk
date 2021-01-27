import { apdu, transport, tx } from '@coolwallet/core';
import * as bnbUtil from './utils/scriptUtil';
import * as txUtil from './utils/transactionUtil';
import * as types from './config/types'

type Transport = transport.default;

export async function transferSignature(
  signData: types.signType,
  denom: string,
  script: string,
  argument: string,
): Promise<string> {
  // if (transactionType !== TransactionType.TRANSFER) {
  //   throw new error.SDKError(transferSignature.name, `Unsupport transactionType: '${transactionType}'`);
  // }

  const canonicalSignature = await sign(
    signData.transport,
    signData.appId,
    signData.appPrivateKey,
    script,
    argument,
    signData.confirmCB,
    signData.authorizedCB,
  );
  return txUtil.composeSignedTransacton(signData.signObj as types.Transfer, denom, canonicalSignature, signData.signPublicKey)
}

export async function walletConnectSignature(
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  script: string,
  argument: string,
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
    script,
    argument,
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
  script: string,
  argument: string,
  confirmCB?: Function,
  authorizedCB?: Function
): Promise<{ r: string; s: string; }> {

  // const transport = signData.transport;

  const preActions = [];
  let action;
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

