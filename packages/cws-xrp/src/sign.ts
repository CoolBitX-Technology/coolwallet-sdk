import { core, Transport } from "@coolwallet/core";
import * as coinUtil from "./util";
import { Transaction } from "./types";

const codec = require("ripple-binary-codec");

type Payment = import("./types").Payment;

const generateRawTx = (signature: any, payment: Payment): string => {
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
    signature = await core.flow.sendScriptAndDataToCard(
      transport,
      appId,
      appPrivateKey,
      script,
      argument,
      false,
      confirmCB,
      authorizedCB,
      false
    );
  } else {
    const payload = Buffer.from(codec.encodeForSigning(payment), "hex");
    const keyId = core.util.addressIndexToKeyId(coinType, addressIndex);
    const dataForSE = core.flow.prepareSEData(keyId, payload, coinType);
    signature = await core.flow.sendDataToCoolWallet(
      transport,
      appId,
      appPrivateKey,
      dataForSE,
      "00",
      false,
      undefined,
      confirmCB,
      authorizedCB,
      false
    );
  }

  return generateRawTx(signature, payment);
};
