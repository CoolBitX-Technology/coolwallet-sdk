import { apdu, tx } from "@coolwallet/core";
import * as scriptUtil from "./utils/scriptUtil";
import * as txUtil from "./utils/trancsactionUtil";
import * as types from "./config/types";
import * as params from "./config/params";

export const signPayment = async (
  signTxData: types.signTxType,
  payment: types.Payment
): Promise<string> => {

  const { transport, addressIndex, appId, appPrivateKey, confirmCB, authorizedCB } = signTxData

  const script = params.TRANSFER.script + params.TRANSFER.signature;
  const argument = await scriptUtil.getPaymentArgument(addressIndex, payment);

  const preActions = [];
  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  }
  preActions.push(sendScript);

  const sendArgument = async () => {
    return apdu.tx.executeScript(
      transport,
      appId,
      appPrivateKey,
      argument
    );
  }

  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    sendArgument,
    false,
    confirmCB,
    authorizedCB,
    false
  );
  return txUtil.generateRawTx(signature.toString('hex'), payment);
};


export const signDelegation = async (
  signTxData: types.signTxType,
  payment: types.Payment
): Promise<string> => {

  const { transport, addressIndex, appId, appPrivateKey, confirmCB, authorizedCB } = signTxData

  const script = params.TRANSFER.script + params.TRANSFER.signature;
  const argument = await scriptUtil.getPaymentArgument(addressIndex, payment);

  const preActions = [];
  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  }
  preActions.push(sendScript);

  const sendArgument = async () => {
    return apdu.tx.executeScript(
      transport,
      appId,
      appPrivateKey,
      argument
    );
  }

  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    sendArgument,
    false,
    confirmCB,
    authorizedCB,
    false
  );
  return txUtil.generateRawTx(signature.toString('hex'), payment);
};