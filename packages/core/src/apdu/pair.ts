/**
 * Toggle Lock card (01 to lock, 00 to unluch)
 * @param {Transport} transport
 * @param {string} signature data
 * @param {string} lock 01 to lock your card
 * @return {Promise<boolean>}
 */
export const switchLockStatus = async (transport: Transport, signature: string, lock: string) => {
  const { statusCode, msg } = await executeCommand(transport, commands.CHANGE_PAIR_STATUS, target.SE, signature, lock);
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.CHANGE_PAIR_STATUS, statusCode, msg)
  }
};
