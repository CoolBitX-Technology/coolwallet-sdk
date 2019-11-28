import { core } from '@coolwallets/core'
import * as util from './icx_util'

/**
 * 
 * @param {Transport} transport 
 * @param {string} appId 
 * @param {string} appPrivateKey 
 * @param {{from:string, to:string, value:string, time:string, networkId:number}} transaction 
 * @param {number} addressIndex 
 * @param {string} publicKey 
 * @param {Function} confirmCB 
 * @param {Function} authorizedCB 
 */
export const signTransaction = async (
  transport,
  appId,
  appPrivateKey,
  transaction,
  addressIndex,
  publicKey,
  confirmCB = null,
  authorizedCB = null,
) => {
  const { script, argument } = util.getScriptAndArguments(addressIndex, transaction)
  
  const { signature: canonicalSignature, cancel } = await core.flow.sendScriptAndDataToCard(
    transport,
    appId,
    appPrivateKey,
    script,
    argument,
    false,
    confirmCB,
    authorizedCB,
    true
  )
  if (cancel) throw 'User canceled.'
  const txHex = await util.generateRawTx(transaction, canonicalSignature, publicKey);
  return txHex;
}
