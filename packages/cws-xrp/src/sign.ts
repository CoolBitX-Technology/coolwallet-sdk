import { core, transport, tx, general } from "@coolwallet/core";
import * as coinUtil from "./util";

const codec = require("ripple-binary-codec");

type Transport = transport.default;
type Payment = import("./types").Payment;

const generateRawTx = (signature: string, payment: Payment): string => {
  /* eslint-disable-next-line no-param-reassign */
  payment.TxnSignature = signature.toUpperCase();
  return codec.encode(payment);
};

// eslint-disable-next-line import/prefer-default-export
export const signPayment = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  coinType: string,
  payment: Payment,
  addressIndex: number,
  confirmCB?: Function | undefined,
  authorizedCB?: Function | undefined
): Promise<string> => {
  const useScript = await core.controller.checkSupportScripts(transport);
  let signature;
  if (useScript) {
    const { script, argument } = coinUtil.getScriptAndArguments(
      addressIndex,
      payment
    );
    const preActions = [];
    const sendScript = async () => {
      await tx.sendScript(transport, script);
    }
    preActions.push(sendScript);

    const sendArgument = async () => {
      return await tx.executeScript(
        transport,
        appId,
        appPrivateKey,
        argument
      );
    }

    signature = await core.flow.getSingleSignatureFromCoolWallet(
      transport,
      preActions,
      sendArgument,
      false,
      confirmCB,
      authorizedCB,
      false
    );
  } else {
    const payload = Buffer.from(codec.encodeForSigning(payment), "hex");
    const keyId = core.util.addressIndexToKeyId(coinType, addressIndex);
    const dataForSE = core.flow.prepareSEData(keyId, payload, coinType);

    const preActions = [];
    const sayHi = async () => {
      await general.hi(transport, appId);
    }
    preActions.push(sayHi)

    const prepareTx = async () => {
      return tx.txPrep(transport, dataForSE, "00", appPrivateKey);
    }

    signature = await core.flow.getSingleSignatureFromCoolWallet(
      transport,
      preActions,
      prepareTx,
      false,
      confirmCB,
      authorizedCB,
      false
    );
  }
  return generateRawTx(signature.toString('hex'), payment);
};
