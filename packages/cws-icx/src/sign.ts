import * as icxUtil from './util'
import { core } from '@coolwallets/core'
import Transport from '@coolwallets/transport'

/**
 * Sign ICON Transaction
 * @param {string} coinType
 * @param {object|string} rawTx
 * @param {number} addressIndex
 * @param {string} publicKey
 */
export const signTransaction = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  coinType: string,
  rawTx: object | string,
  addressIndex: number,
  publicKey: string,
  confirmCB: Function | undefined = undefined,
  authorizedCB: Function | undefined = undefined
): Promise<Object> => {
  const keyId = core.util.addressIndexToKeyId(coinType, addressIndex)
  const phraseToSign = icxUtil.generateHashKey(rawTx)
  const rawPayload = Buffer.from(phraseToSign, 'utf-8')
  const dataForSE = core.txFlow.prepareSEData(keyId, rawPayload, coinType)
  const signature = await core.txFlow.sendDataToCoolWallet(
    transport,
    appId,
    appPrivateKey,
    dataForSE,
    '00',
    '00',
    false,
    undefined,
    confirmCB,
    authorizedCB,
    true
  )

  const txObject = await icxUtil.generateRawTx(signature, rawTx, publicKey)
  return txObject
}
