import { executeCommand } from './execute';
import { RESPONSE } from '../config/response';

/**
 * set bip32 root seed
 * @param {Transport} transport
 * @param {string} seedHexWithSig
 * @return {Promise<boolean>}
 */
export const setSeed = async (transport, seedHexWithSig, forceUseSC) => {
  const { status } = await executeCommand(transport, 'SET_SEED', 'SE', seedHexWithSig, null, null, true, forceUseSC);
  return status === RESPONSE.SUCCESS;
};

/**
 *
 * @param {Transport} transport
 * @param {string} strengthWithSig data field
 * @return {Promise<boolean>}
 */
export const createWallet = async (transport, strengthWithSig, forceUseSC) => {
  const { status } = await executeCommand(
    transport,
    'CREATE_WALLET',
    'SE',
    strengthWithSig,
    null,
    null,
    true,
    forceUseSC
  );
  return status === RESPONSE.SUCCESS;
};

/**
 * Finish create wallet with checksum.
 * @param {Transport} transport
 * @param {string} hexCheckSum data field
 * @return {Promise<boolean>}
 */
export const submitCheckSum = async (transport, hexCheckSum) => {
  const { status } = await executeCommand(transport, 'CHECKSUM', 'SE', hexCheckSum);
  return status === RESPONSE.SUCCESS;
};

/**
 * 
 * @param {Transport} transport
 * @param {string} P1 
 */
export const initSecureRecovery = async (transport, P1) => {
  const { status } = await executeCommand(transport, 'MCU_SET_MNEMONIC_INFO', 'SE', null, P1, null);
  return status === RESPONSE.SUCCESS;
};

/**
 * 
 * @param {Transport} transport
 * @param {string} P1 
 */
export const setSecureRecveryIdx = async (transport, P1) => {
  const { status } = await executeCommand(transport, 'MCU_SET_CHARACTER_ID', 'SE', null, P1, null);
  return status === RESPONSE.SUCCESS;
};

/**
 *
 * @param {Transport} transport
 * @param {string} P1
 */
export const cancelSecureRecovery = async (transport, P1) => {
  const { status } = await executeCommand(transport, 'MCU_CANCEL_RECOVERY', 'SE', null, P1, null);
  return status === RESPONSE.SUCCESS;
};

/**
 *
 * @param {Transport} transport
 */
export const getSecureRecoveryStatus = async (transport) => {
  const { status, outputData } = await executeCommand(transport, 'GET_MCU_STATUS', 'SE', null, null, null);
  return status;
};
