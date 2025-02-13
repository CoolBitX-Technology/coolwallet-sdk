import { tx } from '@coolwallet/core';
import * as scriptUtil from "./utils/scriptUtil";
import * as txUtil from "./utils/tracsactionUtil";
import * as types from "./config/types";
import * as params from "./config/params";
import { SignatureType } from '@coolwallet/core/lib/transaction/type';

export const signPayment = async (
  signTxData: types.signTxType,
  payment: types.Payment
): Promise<string> => {

  const { transport, addressIndex, appId, appPrivateKey, confirmCB, authorizedCB } = signTxData

  const script = params.TRANSFER.script + params.TRANSFER.signature;
  const argument = await scriptUtil.getPaymentArgument(addressIndex, payment);

  const preActions = [];
  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  }
  preActions.push(sendScript);

  const sendArgument = async () => {
    return tx.command.executeScript(
      transport,
      appId,
      appPrivateKey,
      argument
    );
  }

  const signature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    sendArgument,
    SignatureType.DER,
    confirmCB,
    authorizedCB
  );
  return txUtil.generateRawTx(signature.toString('hex'), payment);
};
