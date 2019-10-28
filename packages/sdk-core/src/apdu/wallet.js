import { executeCommand } from './execute'

export const setSeed = async (transport, seedHex) => {
  await executeCommand(transport, 'SET_SEED', 'SE', seedHex) 
  return true
};

/**
 * 
 * @param {Transport} transport 
 * @param {string} strengthWithSig data field
 * @return {Promise<boolean>}
 */
export const createWallet = async (transport, strengthWithSig) => {
  await executeCommand(transport, 'CREATE_WALLET', 'SE', strengthWithSig)
  return true
};

/**
 * Finish create wallet with checksum.
 * @param {Transport} transport 
 * @param {string} hex_checkSum data field
 * @return {Promise<boolean>}
 */
export const submitCheckSum = async (transport, hex_checkSum) => {
  await executeCommand(transport, 'CHECKSUM', 'SE', hex_checkSum)
  return true
};

