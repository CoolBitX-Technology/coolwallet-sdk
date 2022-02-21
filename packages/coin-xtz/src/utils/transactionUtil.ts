import { hexString } from "../config/types";

/** 
 * Get Tezos (XTZ) submit transaction 
 * @param {hexString} formatTxData - address (b58c)
 * @param {hexString} signature - address (hex)
 * @returns {hexString} submit transaction
 */
export function getSubmitTransaction(formatTxData: hexString, signature: hexString): hexString {
  const sumitTx = formatTxData + signature;
  return sumitTx;
}
