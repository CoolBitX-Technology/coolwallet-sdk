import { core } from '@coolwallets/core';
import * as bnbUtil from './util';

type Transport = import('@coolwallets/transport').default;

/**
 * Sign Binance Tranaction
 * @param {string} coinType
 * @param {string} readType
 * @param {object} signObj
 * @param {number} addressIndex
 * @param {boolean} returnTx
 * @param {string} publicKey
 * @return {string | object} transaction Hex or signature object { wcSignature, wcPublicKey }
 */
export default async function signTransaction(
  transport: Transport,
  appId: string,
  appPrivateKey:string,
  coinType:string,
  readType:string,
  signObj: any,
  addressIndex: number,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined,
): Promise<string> {
  const keyId = core.util.addressIndexToKeyId(coinType, addressIndex);
  const rawPayload = bnbUtil.convertObjectToSignBytes(signObj); // .toString('hex');

  const dataForSE = core.flow.prepareSEData(keyId, rawPayload, readType);
  const signature = await core.flow.sendDataToCoolWallet(
    transport,
    appId,
    appPrivateKey,
    dataForSE,
    '00',
    '00',
    false,
    undefined,
    confirmCB,
    authorizedCB
  );

  return bnbUtil.combineSignature(signature);
}
