import { tx } from '@coolwallet/core';
import * as scriptUtil from './utils/scriptUtil';
import * as txUtil from './utils/tracsactionUtil';
import * as types from './config/types';
import * as params from './config/params';
import { SignatureType } from '@coolwallet/core/lib/transaction/type';
import { TOKENTYPE } from './config/tokenType';
import { parseIouToken } from './utils/stringUtil';

export const signPayment = async (signTxData: types.SignTxType, payment: types.Payment): Promise<string> => {
  const { transport, addressIndex, appId, appPrivateKey, confirmCB, authorizedCB } = signTxData;
  // Use the new script when memo exists, or flags/destination tag is missing.
  const useNewScript = Boolean(payment.Memos) || payment.Flags === undefined || payment.DestinationTag === undefined;
  const script = params.getScript(useNewScript);
  const argument = await scriptUtil.getPaymentArgument(addressIndex, payment, useNewScript);

  const preActions = [];
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
    SignatureType.DER,
    confirmCB,
    authorizedCB
  );
  return txUtil.generateRawTx(signature.toString('hex'), payment);
};

export const signMessage = async (signMsgData: types.SignMsgType): Promise<string> => {
  const { transport, appPrivateKey, appId, addressIndex, message, confirmCB, authorizedCB } = signMsgData;
  // Use the new script when memo exists, or flags/destination tag is missing.

  const script = params.MESSAGE.script + params.MESSAGE.signature;
  const argument = await scriptUtil.getMessageArgument(addressIndex, message);

  const preActions = [];
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
    SignatureType.DER,
    confirmCB,
    authorizedCB
  );

  return signature.toString('hex').toUpperCase();
};

export const signTrustSet = async (
  signTxData: types.SignTrustSetType,
  tokenPayment: types.TokenPayment
): Promise<string> => {
  const { transport, appPrivateKey, appId, addressIndex, confirmCB, authorizedCB } = signTxData;
  const { Token: token } = tokenPayment;
  let isRLUSD = false;
  for (const tokenInfo of TOKENTYPE) {
    const { currency, issuer } = parseIouToken(tokenInfo.contractAddress);
    if (
      currency.toLowerCase() === token.code.toLowerCase() &&
      tokenInfo.name === token.name &&
      issuer === token.issuer
    ) {
      isRLUSD = true;
      break;
    }
  }
  let script: string;
  if (isRLUSD) {
    script = params.TRUST_SET_RLUSD.script + params.TRUST_SET_RLUSD.signature;
  } else {
    script = params.TRUST_SET.script + params.TRUST_SET.signature;
  }

  const argument = await scriptUtil.getTrustSetArgument(addressIndex, tokenPayment, isRLUSD);
  const preActions = [];
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
    SignatureType.DER,
    confirmCB,
    authorizedCB
  );

  return txUtil.generateTrustSetRawTx(signature.toString('hex'), tokenPayment);
};
