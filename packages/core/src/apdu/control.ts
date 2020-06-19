import { executeCommand } from './execute';
import { RESPONSE } from '../config/response';
import Transport from '../transport';

/**
 * Response boolean (isCardRecognized)
 * @param {Transport} transport
 * @param {string} appId
 * @return {Promise<boolean>} isCardRecognized
 */
export const sayHi = async (transport: Transport, appId: string): Promise<boolean> => {
  try {
    const { status } = await executeCommand(transport, 'SAY_HI', 'SE', appId);
    return status === RESPONSE.SUCCESS;
  } catch (error) {
    return false;
  }
};

/**
 * Get nonce from CWS
 * @param {Transport} transport
 * @return {Promise<string>}
 */
export const getNonce = async (transport: Transport): Promise<string> => {
  const { outputData: nonce } = await executeCommand(transport, 'GET_NONCE', 'SE');
  return nonce;
};

/**
 * Cancel last APDU
 * @param {Transport} transport
 */
export const cancelAPDU = async (transport: Transport) => {
  await executeCommand(transport, 'CANCEL_APDU', 'SE');
};

/**
 * Power off SE
 * @param {Transport}
 * @return {Promise<boolean>}
 */
export const powerOff = async (transport: Transport): Promise<boolean> => {
  await executeCommand(transport, 'PWR_OFF', 'SE');
  return true;
};
