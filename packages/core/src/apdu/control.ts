import { executeCommand } from './execute';
import Transport from '../transport';
import { Commands } from "./command";

/**
 * Get nonce from CWS
 * @param {Transport} transport
 * @return {Promise<string>}
 */
export const getNonce = async (transport: Transport): Promise<string> => {
  const { outputData: nonce } = await executeCommand(transport, Commands.GET_NONCE, 'SE');
  return nonce;
};

/**
 * Cancel last APDU
 * @param {Transport} transport
 */
export const cancelAPDU = async (transport: Transport) => {
  await executeCommand(transport, Commands.CANCEL_APDU, 'SE');
};

/**
 * Power off SE
 * @param {Transport}
 * @return {Promise<boolean>}
 */
export const powerOff = async (transport: Transport): Promise<boolean> => {
  await executeCommand(transport, Commands.PWR_OFF, 'SE');
  return true;
};
