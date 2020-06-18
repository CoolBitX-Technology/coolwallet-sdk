import { executeCommand } from './execute';
import { RESPONSE } from '../config/response';
import Transport from '../transport';

/**
 * set bip32 root seed
 * @param {Transport} transport
 * @param {string} seedHexWithSig
 * @return {Promise<boolean>}
 */
export const setSeed = async (transport: Transport, seedHexWithSig: string, forceUseSC: boolean): Promise<boolean> => {
  const { status } = await executeCommand(transport, 'SET_SEED', 'SE', seedHexWithSig, undefined, undefined, true, forceUseSC);
  return status === RESPONSE.SUCCESS;
};

/**
 *
 * @param {Transport} transport
 * @param {string} strengthWithSig data field
 * @return {Promise<boolean>}
 */
export const createWallet = async (transport: Transport, strengthWithSig: string, forceUseSC: boolean): Promise<boolean> => {
  const { status } = await executeCommand(
    transport,
    'CREATE_WALLET',
    'SE',
    strengthWithSig,
    undefined,
    undefined,
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
export const submitCheckSum = async (transport: Transport, hexCheckSum: string): Promise<boolean> => {
  const { status } = await executeCommand(transport, 'CHECKSUM', 'SE', hexCheckSum);
  return status === RESPONSE.SUCCESS;
};

/**
 * 
 * @param {Transport} transport
 * @param {string} P1 
 */
export const initSecureRecovery = async (transport: Transport, P1: string) => {
  const { status } = await executeCommand(transport, 'MCU_SET_MNEMONIC_INFO', 'SE', undefined, P1, undefined);
  return status === RESPONSE.SUCCESS;
};

/**
 * 
 * @param {Transport} transport
 * @param {string} P1 
 */
export const setSecureRecoveryIdx = async (transport: Transport, P1: string) => {
  const { status } = await executeCommand(transport, 'MCU_SET_CHARACTER_ID', 'SE', undefined, P1, undefined);
  return status === RESPONSE.SUCCESS;
};

/**
 *
 * @param {Transport} transport
 * @param {string} P1
 */
export const cancelSecureRecovery = async (transport: Transport, P1: string) => {
  const { status } = await executeCommand(transport, 'MCU_CANCEL_RECOVERY', 'SE', undefined, P1, undefined);
  return status === RESPONSE.SUCCESS;
};

/**
 *
 * @param {Transport} transport
 */
export const getSecureRecoveryStatus = async (transport: Transport) => {
  const { status, outputData } = await executeCommand(transport, 'GET_MCU_STATUS', 'SE', undefined, undefined, undefined);
  return status;
};
