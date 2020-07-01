import { setting } from '../apdu/index';
import Transport from '../transport';

/**
 * Check if the current SE support script execution
 * @param {Transport} transport
 * @returns {Promise<boolean>}
 */
export const checkSupportScripts = async (transport: Transport): Promise<boolean> => {
    const SEVersion = await setting.getSEVersion(transport);
  if (SEVersion >= 200){
    return true;
  } else {
    return false;
  }
};
