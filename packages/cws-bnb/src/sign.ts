import { core, transport } from '@coolwallet/core';
import * as bnbUtil from './util';

type Transport = transport.default;
type BNBTx = import('./types').Transaction;

/**
 * Sign Binance Tranaction
 */
export default async function signTransfer(
  transport: Transport,
  appId: string,
  appPrivateKey:string,
  coinType:string,
  readType:string,
  signObj: BNBTx,
  addressIndex: number,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined,
): Promise<string> {
  const keyId = core.util.addressIndexToKeyId(coinType, addressIndex);
  const rawPayload = bnbUtil.convertObjectToSignBytes(signObj); // .toString('hex');

  const dataForSE = core.flow.prepareSEData(keyId, rawPayload, readType);
  const signature = await core.flow.getSingleSignatureFromCoolWallet(
    transport,
    appId,
    appPrivateKey,
    dataForSE,
    '00',
    false,
    undefined,
    confirmCB,
    authorizedCB
  );

  return bnbUtil.combineSignature(signature);
}
