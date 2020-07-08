import { executeCommand } from './execute/execute';
import Transport from '../transport';
import { commands } from "./execute/command";
import { target } from '../config/target';
import { CODE } from '../config/status/code';
import { SDKError, APDUError } from '../error/errorHandle';


/**
 * Authorization for requesting account keys
 * @param {Transport} transport
 * @param {string} signature
 * @return { Promise<boolean> }
 */
export const authGetExtendedKey = async (transport: Transport, signature: string, forceUseSC: boolean
): Promise<boolean> => {
  const { statusCode, msg } = await executeCommand(transport, commands.AUTH_EXT_KEY, target.SE, signature, undefined, undefined, true, forceUseSC);
  if (statusCode === CODE._9000) {
    return true
  } else {
    throw new APDUError(commands.AUTH_EXT_KEY, statusCode, msg)
  }
};


/**
 * Get ECDSA Account Extended public key (Encrypted)
 * @param {*} transport
 * @param {string} coinType P1
 * @param {string} accIndex P2
 * @return {Promise<string>}
 */
export const getAccountExtendedKey = async (transport: Transport, coinType: string, accIndex: string): Promise<string> => {
  const { outputData: key, statusCode, msg } = await executeCommand(transport, commands.GET_EXT_KEY, target.SE, undefined, coinType, accIndex);
  if (key) {
    return key
  } else {
    throw new APDUError(commands.GET_EXT_KEY, statusCode, msg)
  }
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
  let commandData;
  if (protocol === 'BIP44') {
    commandData = commands.GET_ED25519_ACC_PUBKEY
  } else if (protocol === 'SLIP0010') {
    commandData = commands.GET_XLM_ACC_PUBKEY
  } else {
    throw new SDKError(getEd25519AccountPublicKey.name, 'Unsupported protocol');
  }

  const { outputData: key, statusCode, msg } = await executeCommand(transport, commands.GET_XLM_ACC_PUBKEY, target.SE, undefined, coinType, accIndex);
  if (key) {
    return key
  } else {
    throw new APDUError(commands.AUTH_EXT_KEY, statusCode, msg)
  }
};
