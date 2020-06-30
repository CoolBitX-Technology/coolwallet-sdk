import { executeCommand } from '../apdu/execute';
import { RESPONSE } from '../config/response';
import Transport from '../transport';
import { commands } from "../apdu/command";


/**
 * Response boolean (isCardRecognized)
 * @param {Transport} transport
 * @param {string} appId
 * @return {Promise<boolean>} isCardRecognized
 */
export const hi = async (transport: Transport, appId: string): Promise<boolean> => {
  try {
    const { status } = await executeCommand(transport, commands.SAY_HI, 'SE', appId);
    return status === RESPONSE.SUCCESS;
  } catch (error) {
    return false;
  }
}