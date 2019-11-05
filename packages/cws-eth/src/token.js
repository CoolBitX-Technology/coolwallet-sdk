import { apdu } from '@coolwallets/core'

/**
 * @param {string} data
 * @return {Boolean}
 */
export const isSupportedERC20Transaction = data => {
  let functionHash = data.slice(0, 8)
  if (functionHash === 'a9059cbb' || functionHash === '095ea7b3') return true
  return false
}

/**
 *
 * @param {String} contractAddress contract Address (0x prefixed)
 * @param {Number} decimals
 * @param {String} symbol
 */
export const getSetTokenPayload = async (contractAddress, symbol, decimals) => {
  const unit = handleHex(decimals.toString(16))
  const len = handleHex(symbol.length.toString(16))
  const symb = handleHex(web3.utils.asciiToHex(symbol))
  const setTokenPayload = unit + len + web3.utils.padRight(symb, 14, '0') + removeHex0x(contractAddress)
  return setTokenPayload
}

/**
 * get Preaction
 * @param {Transport} transport
 * @param {boolean} isBuiltIn
 * @param {string} setTokenPayload
 * @return {Function}
 */
export const getSetTokenPreAction = (isBuiltIn, setTokenPayload) => {
  if (isBuiltIn) {
    return async () => {
      await apdu.tx.setToken(transport, setTokenPayload)
    }
  } else {
    return async () => {
      await apdu.tx.setCustomToken(transport, setTokenPayload)
    }
  }
}
