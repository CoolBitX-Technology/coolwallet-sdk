import { executeCommand } from './execute'
import { RESPONSE } from '../config/response'

/**
 * set bip32 root seed
 * @param {Transport} transport
 * @param {string} seedHexWithSig
 * @return {Promise<boolean>}
 */
export const setSeed = async (transport, seedHexWithSig) => {
  const { status } = await executeCommand(transport, 'SET_SEED', 'SE', seedHexWithSig)
  return status === RESPONSE.SUCCESS
}

/**
 *
 * @param {Transport} transport
 * @param {string} strengthWithSig data field
 * @return {Promise<boolean>}
 */
export const createWallet = async (transport, strengthWithSig) => {
  const { status } = await executeCommand(transport, 'CREATE_WALLET', 'SE', strengthWithSig)
  return status === RESPONSE.SUCCESS
}

/**
 * Finish create wallet with checksum.
 * @param {Transport} transport
 * @param {string} hex_checkSum data field
 * @return {Promise<boolean>}
 */
export const submitCheckSum = async (transport, hex_checkSum) => {
  const { status } = await executeCommand(transport, 'CHECKSUM', 'SE', hex_checkSum)
  return status === RESPONSE.SUCCESS
}
