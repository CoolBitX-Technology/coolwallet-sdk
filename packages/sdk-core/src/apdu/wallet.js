import { executeCommand } from './execute'

export const setSeed = async (transport, seedHex) => {
  await executeCommand(transport, 'SET_SEED', 'SE', seedHex) 
  return true
};

/**
 * Authorization for requesting account keys
 * @param {Transport} transport 
 * @param {string} signature 
 * @return { Promise<boolean> }
 */
export const authGetExtendedKey = async (transport, signature) => {
  await executeCommand(transport, 'AUTH_EXT_KEY', 'SE', signature) 
  return true;
};

/**
 * Get ECDSA Account Extended public key (Encrypted)
 * @param {*} transport 
 * @param {string} coinType P1
 * @param {string} accIndex P2
 * @return {Promise<string>}
 */
export const getAccountExtendedKey = async (transport, coinType, accIndex) => {
  const { outputData } = await executeCommand(transport, 'GET_EXT_KEY', 'SE', null, coinType, accIndex)
  return outputData
};

/**
 * Get ED25519 Account Public Key (Encrypted)
 * @param {Transport} transport 
 * @param {string} coinType P1
 * @param {string} accIndex P2
 * @return {Promise<string>}
 */
export const getEd25519AccountPublicKey = async (transport, coinType, accIndex) => {
  const { outputData } = await executeCommand(transport, 'GET_ED25519_ACC_PUBKEY', 'SE', null, coinType, accIndex)
  return outputData
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
 * 
 * @param {Transport} transport 
 * @param {string} hex_checkSum data field
 * @return {Promise<boolean>}
 */
export const finishBackup = async (transport, hex_checkSum) => {
  await executeCommand(transport, 'FINISH_BACKUP', 'SE', hex_checkSum)
  return true
};

