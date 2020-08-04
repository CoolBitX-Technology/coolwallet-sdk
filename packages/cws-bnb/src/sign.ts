import { apdu, transport, tx, error, util } from '@coolwallet/core';
import * as bnbUtil from './util';
import { coinType, TransactionType, Transfer, PlaceOrder, CancelOrder } from './types'

type Transport = transport.default;
//type BNBTx = import('./types').Transaction;

/**
 * Sign Binance Tranaction
 */
export default async function sign(
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  transactionType: TransactionType,
  readType: string,
  signObj: Transfer | PlaceOrder | CancelOrder,
  addressIndex: number,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined,
): Promise<string> {
  if (transactionType !== TransactionType.TRANSFER
    && transactionType !== TransactionType.PLACE_ORDER
    && transactionType !== TransactionType.CANCEL_ORDER) {
    throw new error.SDKError(sign.name, `Unsupport transactionType: '${transactionType}'`);
  }
  const useScript = await util.checkSupportScripts(transport);
  const preActions = [];
  let action;
  if (useScript) {
    const { script, argument } = bnbUtil.getScriptAndArguments(transactionType, addressIndex, signObj);
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

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  return bnbUtil.combineSignature(canonicalSignature);
}
