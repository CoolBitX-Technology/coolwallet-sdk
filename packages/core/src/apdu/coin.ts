import { executeCommand } from './execute';
import Transport from '../transport';

/**
 * Authorization for requesting account keys
 * @param {Transport} transport
 * @param {string} signature
 * @return { Promise<boolean> }
 */
export const authGetExtendedKey = async (transport: Transport, signature: string, forceUseSC: boolean): Promise<boolean> => {
  await executeCommand(transport, 'AUTH_EXT_KEY', 'SE', signature, undefined, undefined, true, forceUseSC);
  return true;
};

/**
 * Get ECDSA Account Extended public key (Encrypted)
 * @param {*} transport
 * @param {string} coinType P1
 * @param {string} accIndex P2
 * @return {Promise<string>}
 */
export const getAccountExtendedKey = async (transport: any, coinType: string, accIndex: string): Promise<string> => {
  const { outputData } = await executeCommand(transport, 'GET_EXT_KEY', 'SE', undefined, coinType, accIndex);
  return outputData;
};

/**
 * Get ED25519 Account Public Key (Encrypted)
 * @param {Transport} transport
 * @param {string} coinType P1
 * @param {string} accIndex P2
 * @param {string} protocol
 * @return {Promise<string>}
 */
export const getEd25519AccountPublicKey = async (transport: Transport, coinType: string, accIndex: string, protocol: string): Promise<string> => {
  if (protocol === 'BIP44') {
    const { outputData } = await executeCommand(transport, 'GET_ED25519_ACC_PUBKEY', 'SE', undefined, coinType, accIndex);
    return outputData;
  }
  if (protocol === 'SLIP0010') {
    const { outputData } = await executeCommand(transport, 'GET_XLM_ACC_PUBKEY', 'SE', undefined, coinType, accIndex);
    return outputData;
  }
  throw Error('Unsupported protocol');
};
